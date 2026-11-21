import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto";
import { authed, json } from "@/lib/route";
import type { ConversationDto } from "@/lib/types";

export const GET = authed(async (user) => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: userCardSelect } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const items: ConversationDto[] = [];
  for (const m of memberships) {
    const otherMember = m.conversation.members.find((x) => x.userId !== user.id);
    const lastMsg = m.conversation.messages[0];

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: m.conversationId,
        senderId: { not: user.id },
        createdAt: { gt: m.lastReadAt },
      },
    });

    items.push({
      id: m.conversationId,
      other: otherMember ? toUserCard(otherMember.user) : null,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            senderId: lastMsg.senderId,
            body: lastMsg.body,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: m.conversation.updatedAt.toISOString(),
    });
  }

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return json({ items });
});

export const POST = authed(async (user, req) => {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return json({ error: "userId is required" }, 400);
  }
  if (body.userId === user.id) {
    return json({ error: "Cannot chat with yourself" }, 400);
  }

  const other = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!other) {
    return json({ error: "User not found" }, 404);
  }

  const mine = await prisma.conversationMember.findMany({
    where: { userId: user.id },
    include: { conversation: { include: { members: true } } },
  });
  const existing = mine.find((m) =>
    m.conversation.members.some((x) => x.userId === body.userId),
  );
  if (existing) {
    return json({ conversationId: existing.conversationId, existing: true });
  }

  const created = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: user.id },
          { userId: body.userId },
        ],
      },
    },
  });

  return json({ conversationId: created.id, existing: false });
});