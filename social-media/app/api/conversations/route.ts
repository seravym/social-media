import { Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto";
import { authed, json } from "@/lib/route";
import type { ConversationDto } from "@/lib/types";

export const GET = authed(async (user) => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: user.id, hiddenAt: null },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: userCardSelect } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const unreadSince = memberships.map((m) => {
    const cleared = m.clearedAt;
    const since =
      cleared && cleared > m.lastReadAt ? cleared : m.lastReadAt;
    return { conversationId: m.conversationId, since };
  });

  const unreadGroups =
    unreadSince.length > 0
      ? await prisma.message.groupBy({
          by: ["conversationId"],
          where: {
            senderId: { not: user.id },
            OR: unreadSince.map((item) => ({
              conversationId: item.conversationId,
              createdAt: { gt: item.since },
            })),
          },
          _count: { _all: true },
        })
      : [];

  const unreadMap = new Map(
    unreadGroups.map((group) => [group.conversationId, group._count._all]),
  );

  const items: ConversationDto[] = memberships.map((m) => {
    const otherMember = m.conversation.members.find((x) => x.userId !== user.id);
    const lastMsg = m.conversation.messages[0];

    return {
      id: m.conversationId,
      other: otherMember ? toUserCard(otherMember.user) : null,
      nickname: otherMember?.nickname ?? null,
      background: m.conversation.background ?? null,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            senderId: lastMsg.senderId,
            body: lastMsg.body,
            imageUrl: lastMsg.imageUrl,
            isForwarded: lastMsg.isForwarded,
            editedAt: lastMsg.editedAt ? lastMsg.editedAt.toISOString() : null,
            deletedAt: lastMsg.deletedAt ? lastMsg.deletedAt.toISOString() : null,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadMap.get(m.conversationId) ?? 0,
      updatedAt: m.conversation.updatedAt.toISOString(),
    };
  });

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return json({ currentUserId: user.id, items });
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
  const existing = mine.find(
    (m) =>
      m.conversation.type === "direct" &&
      m.conversation.members.length === 2 &&
      m.conversation.members.some((x) => x.userId === body.userId),
  );
  if (existing) {
    await prisma.conversationMember.updateMany({
      where: { conversationId: existing.conversationId, userId: user.id },
      data: { hiddenAt: null },
    });
    return json({ conversationId: existing.conversationId, existing: true });
  }

  const conversationId = `direct_${[user.id, body.userId].sort().join("_")}`;

  try {
    const created = await prisma.conversation.create({
      data: {
        id: conversationId,
        type: "direct",
        members: {
          create: [{ userId: user.id }, { userId: body.userId }],
        },
      },
    });

    return json({ conversationId: created.id, existing: false });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true },
      });
      if (raced) {
        await prisma.conversationMember.updateMany({
          where: { conversationId: raced.id, userId: user.id },
          data: { hiddenAt: null },
        });
        return json({ conversationId: raced.id, existing: true });
      }
    }
    throw error;
  }
});
