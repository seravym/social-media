import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import type { ChatMessageDto } from "@/lib/types";

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
  })
  .refine(
    (data) => data.body.length > 0 || Boolean(data.imageUrl && data.imageUrl.length > 0),
    { message: "Message body or imageUrl is required" }
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

    const dto: ChatMessageDto = {
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
    };

    return json(dto, 201);
  }
);
