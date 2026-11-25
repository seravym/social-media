import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto";
import { authed, json } from "@/lib/route";
import type { ConversationDetailDto } from "@/lib/types";

export const GET = authed(async (user, req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  const me = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!me) {
    return json({ error: "Conversation not found" }, 404);
  }

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: userCardSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const otherMember = conv.members.find((x) => x.userId !== user.id);

  const dto: ConversationDetailDto = {
    id: conv.id,
    other: otherMember ? toUserCard(otherMember.user) : null,
    messages: conv.messages.slice().reverse().map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    })),
  };

  return json(dto);
});