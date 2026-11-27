import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import type { ChatMessageDto } from "@/lib/types";

const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
const HTTP_URL_RE = /^https?:\/\/.+/i;

function isValidImageUrl(value: string): boolean {
  return IMAGE_DATA_URL_RE.test(value) || HTTP_URL_RE.test(value);
}

function toMessageDto(message: {
  id: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
  };
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
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit,
      });

      return json({
        currentUserId: user.id,
        messages: messages.map(toMessageDto),
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();

    return json({
      currentUserId: user.id,
      messages: page.map(toMessageDto),
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
      select: { conversationId: true },
    });
    if (!membership) {
      return json({ error: "Conversation not found" }, 404);
    }

    const normalizedImageUrl =
      parsed.data.imageUrl && parsed.data.imageUrl.length > 0
        ? parsed.data.imageUrl
        : null;

    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          body: parsed.data.body,
          imageUrl: normalizedImageUrl,
        },
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

    return json(toMessageDto(message), 201);
  }
);
