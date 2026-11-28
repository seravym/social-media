import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import { messageInclude, toMessageDto } from "@/lib/chat";

export const POST = authed<{
  params: Promise<{ id: string; messageId: string }>;
}>(async (user, _req, { params }) => {
  const { id, messageId } = await params;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    select: { conversationId: true },
  });
  if (!membership) {
    return json({ error: "Percakapan tidak ditemukan" }, 404);
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: id },
    select: { id: true, pinnedAt: true, deletedAt: true },
  });
  if (!message) {
    return json({ error: "Pesan tidak ditemukan" }, 404);
  }
  if (message.deletedAt) {
    return json({ error: "Pesan sudah dihapus" }, 400);
  }

  const shouldPin = !message.pinnedAt;
  const now = new Date();

  await prisma.$transaction([
    prisma.message.updateMany({
      where: { conversationId: id, pinnedAt: { not: null } },
      data: { pinnedAt: null },
    }),
    prisma.message.update({
      where: { id: messageId },
      data: { pinnedAt: shouldPin ? now : null },
    }),
  ]);

  const updated = await prisma.message.findUnique({
    where: { id: messageId },
    include: messageInclude,
  });
  if (!updated) {
    return json({ error: "Pesan tidak ditemukan" }, 404);
  }

  return json(toMessageDto(updated, user.id));
});
