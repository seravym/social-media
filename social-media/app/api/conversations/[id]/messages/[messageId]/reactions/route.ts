import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import { messageInclude, toMessageDto } from "@/lib/chat";

const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(16),
});

export const POST = authed<{
  params: Promise<{ id: string; messageId: string }>;
}>(async (user, req, { params }) => {
  const { id, messageId } = await params;

  const parsed = reactionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Emoji tidak valid." }, 400);
  }

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    select: { conversationId: true },
  });
  if (!membership) {
    return json({ error: "Percakapan tidak ditemukan" }, 404);
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: id },
    select: { id: true, deletedAt: true },
  });
  if (!message) {
    return json({ error: "Pesan tidak ditemukan" }, 404);
  }
  if (message.deletedAt) {
    return json({ error: "Pesan sudah dihapus" }, 400);
  }

  const emoji = parsed.data.emoji;
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId: user.id } },
    select: { id: true, emoji: true },
  });

  if (existing && existing.emoji === emoji) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.messageReaction.update({
      where: { id: existing.id },
      data: { emoji },
    });
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId: user.id, emoji },
    });
  }

  const updated = await prisma.message.findUnique({
    where: { id: messageId },
    include: messageInclude,
  });
  if (!updated) {
    return json({ error: "Pesan tidak ditemukan" }, 404);
  }

  return json(toMessageDto(updated, user.id));
});
