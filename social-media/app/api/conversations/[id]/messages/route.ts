import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import type { ChatMessageDto } from "@/lib/types";

const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const POST = authed<{ params: Promise<{ id: string }> }>(
  async (user, req, { params }) => {
    const { id } = await params;

    const parsed = messageSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: "Message must be 1-4000 characters" }, 400);
    }

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      select: { conversationId: true },
    });
    if (!membership) {
      return json({ error: "Conversation not found" }, 404);
    }

    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          body: parsed.data.body,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: now },
      }),
      prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId: id, userId: user.id } },
        data: { lastReadAt: now },
      }),
    ]);

    const dto: ChatMessageDto = {
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };

    return json(dto, 201);
  }
);
