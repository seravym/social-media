import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import { messageInclude, toMessageDto } from "@/lib/chat";
import { checkDirectMessagePermission } from "@/lib/messaging-privacy";

const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
const HTTP_URL_RE = /^https?:\/\/.+/i;

function isValidImageUrl(value: string): boolean {
  return IMAGE_DATA_URL_RE.test(value) || HTTP_URL_RE.test(value);
}

const messageSchema = z
  .object({
    body: z.string().trim().max(4000).optional().default(""),
    imageUrl: z
      .string()
      .trim()
      .max(2_000_000)
      .refine((v) => v === "" || isValidImageUrl(v), {
        message: "Invalid image URL or data URL",
      })
      .nullable()
      .optional(),
    isForwarded: z.boolean().optional(),
    replyToId: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine(
    (data) => data.body.length > 0 || Boolean(data.imageUrl && data.imageUrl.length > 0),
    { message: "Message body or imageUrl is required" }
  );

export const GET = authed<{ params: Promise<{ id: string }> }>(
  async (user, req, { params }) => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      select: { clearedAt: true },
    });
    if (!membership) {
      return json({ error: "Conversation not found" }, 404);
    }

    const clearedAt = membership.clearedAt;
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 30;

    const afterRaw = searchParams.get("after");
    if (afterRaw) {
      const after = new Date(afterRaw);
      if (Number.isNaN(after.getTime())) {
        return json({ error: "Invalid after value" }, 400);
      }

      const threshold = clearedAt && clearedAt > after ? clearedAt : after;
      const messages = await prisma.message.findMany({
        where: {
          conversationId: id,
          createdAt: { gt: threshold },
        },
        include: messageInclude,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit,
      });

      return json({
        currentUserId: user.id,
        messages: messages.map((message) => toMessageDto(message, user.id)),
        hasMore: messages.length === limit,
      });
    }

    const cursor = searchParams.get("cursor");
    if (cursor) {
      const cursorMessage = await prisma.message.findFirst({
        where: { id: cursor, conversationId: id },
        select: { id: true },
      });
      if (!cursorMessage) {
        return json({ error: "Cursor not found" }, 400);
      }
    }

    const rows = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
      },
      include: messageInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();

    return json({
      currentUserId: user.id,
      messages: page.map((message) => toMessageDto(message, user.id)),
      hasMore,
    });
  }
);

export const POST = authed<{ params: Promise<{ id: string }> }>(
  async (user, req, { params }) => {
    const { id } = await params;

    const parsed = messageSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message payload" },
        400
      );
    }

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      select: {
        conversationId: true,
        user: { select: { username: true } },
        conversation: {
          select: {
            type: true,
            members: {
              where: { userId: { not: user.id } },
              select: {
                userId: true,
                user: { select: { username: true } },
              },
            },
          },
        },
      },
    });
    if (!membership) {
      return json({ error: "Conversation not found" }, 404);
    }

    if (membership.conversation.type === "direct") {
      const other = membership.conversation.members[0];
      if (other) {
        const permission = await checkDirectMessagePermission({
          senderId: user.id,
          senderUsername: membership.user.username,
          recipientId: other.userId,
          recipientUsername: other.user.username,
        });
        if (!permission.allowed) {
          return json({ error: permission.reason }, 403);
        }
      }
    }

    const normalizedImageUrl =
      parsed.data.imageUrl && parsed.data.imageUrl.length > 0
        ? parsed.data.imageUrl
        : null;

    const replyToId = parsed.data.replyToId ?? null;
    if (replyToId) {
      const replyTarget = await prisma.message.findFirst({
        where: { id: replyToId, conversationId: id, deletedAt: null },
        select: { id: true },
      });
      if (!replyTarget) {
        return json({ error: "Pesan yang dibalas tidak ditemukan." }, 400);
      }
    }

    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          body: parsed.data.body,
          imageUrl: normalizedImageUrl,
          isForwarded: parsed.data.isForwarded ?? false,
          replyToId,
        },
        include: messageInclude,
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: now },
      }),
      prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId: id, userId: user.id } },
        data: { lastReadAt: now, hiddenAt: null },
      }),
      prisma.conversationMember.updateMany({
        where: { conversationId: id, hiddenAt: { not: null } },
        data: { hiddenAt: null },
      }),
    ]);

    return json(toMessageDto(message, user.id), 201);
  }
);
