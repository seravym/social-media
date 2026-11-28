import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import { messageInclude, toMessageDto } from "@/lib/chat";

const editMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const PATCH = authed<{
  params: Promise<{ id: string; messageId: string }>;
}>(async (user, req, { params }) => {
  const { id, messageId } = await params;

  const parsed = editMessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message payload" },
      400
    );
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: id },
  });
  if (!message) {
    return json({ error: "Message not found" }, 404);
  }
  if (message.senderId !== user.id) {
    return json({ error: "Forbidden" }, 403);
  }
  if (message.deletedAt) {
    return json({ error: "Message already deleted" }, 400);
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { body: parsed.data.body, editedAt: new Date() },
    include: messageInclude,
  });

  return json(toMessageDto(updated, user.id));
});

export const DELETE = authed<{
  params: Promise<{ id: string; messageId: string }>;
}>(async (user, _req, { params }) => {
  const { id, messageId } = await params;

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: id },
  });
  if (!message) {
    return json({ error: "Message not found" }, 404);
  }
  if (message.senderId !== user.id) {
    return json({ error: "Forbidden" }, 403);
  }
  if (message.deletedAt) {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
    return json(toMessageDto(existing!, user.id));
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), pinnedAt: null },
    include: messageInclude,
  });

  return json(toMessageDto(updated, user.id));
});
