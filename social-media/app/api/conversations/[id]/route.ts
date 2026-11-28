import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto";
import { authed, json, noContent } from "@/lib/route";
import { messageInclude, toMessageDto } from "@/lib/chat";
import type { ConversationDetailDto } from "@/lib/types";

const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
const HTTP_URL_RE = /^https?:\/\/.+/i;
const SAFE_STYLE_RE = /^[a-zA-Z0-9#(),.%_\s-]{1,120}$/;

function isValidBackground(value: string): boolean {
  if (value.includes("|")) {
    const [theme, ...rest] = value.split("|");
    const image = rest.join("|");
    const themeOk = theme === "" || SAFE_STYLE_RE.test(theme);
    const imageOk =
      image === "" || IMAGE_DATA_URL_RE.test(image) || HTTP_URL_RE.test(image);
    return themeOk && imageOk;
  }
  return (
    IMAGE_DATA_URL_RE.test(value) ||
    HTTP_URL_RE.test(value) ||
    SAFE_STYLE_RE.test(value)
  );
}

const updateConversationSchema = z
  .object({
    background: z
      .string()
      .trim()
      .max(2_000_000)
      .refine((v) => v === "" || isValidBackground(v), {
        message: "Invalid background value",
      })
      .nullable()
      .optional(),
    nickname: z.string().trim().max(50).nullable().optional(),
    targetUserId: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => data.background !== undefined || data.nickname !== undefined,
    { message: "Provide background or nickname to update" }
  );

export const GET = authed(async (user, _req, ctx: { params: Promise<{ id: string }> }) => {
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
      messages: {
        include: messageInclude,
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const otherMember = conv.members.find((x) => x.userId !== user.id);

  const dto: ConversationDetailDto = {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    currentUserId: user.id,
    background: conv.background ?? null,
    other: otherMember ? toUserCard(otherMember.user) : null,
    nickname: otherMember?.nickname ?? null,
    members: conv.members.map((m) => ({
      user: toUserCard(m.user),
      nickname: m.nickname ?? null,
    })),
    messages: conv.messages
      .slice()
      .reverse()
      .map((msg) => toMessageDto(msg, user.id)),
  };

  return json(dto);
});

export const PATCH = authed(async (user, req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  const parsed = updateConversationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      400
    );
  }

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: userCardSelect } } },
    },
  });
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const isMember = conv.members.some((m) => m.userId === user.id);
  if (!isMember) {
    return json({ error: "Conversation not found" }, 404);
  }

  const { background, nickname, targetUserId } = parsed.data;

  if (nickname !== undefined) {
    const resolvedTargetId =
      targetUserId ?? conv.members.find((m) => m.userId !== user.id)?.userId ?? user.id;
    const targetExists = conv.members.some((m) => m.userId === resolvedTargetId);
    if (!targetExists) {
      return json({ error: "Target member not found in conversation" }, 404);
    }

    const normalizedNickname = nickname === null || nickname === "" ? null : nickname;
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: resolvedTargetId,
        },
      },
      data: { nickname: normalizedNickname },
    });
  }

  if (background !== undefined) {
    const normalizedBackground =
      background === null || background === "" ? null : background;
    await prisma.conversation.update({
      where: { id },
      data: { background: normalizedBackground },
    });
  }

  const updated = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: userCardSelect } } },
    },
  });
  if (!updated) {
    return json({ error: "Conversation not found" }, 404);
  }

  const otherMember = updated.members.find((x) => x.userId !== user.id);

  return json({
    id: updated.id,
    background: updated.background ?? null,
    other: otherMember ? toUserCard(otherMember.user) : null,
    nickname: otherMember?.nickname ?? null,
    members: updated.members.map((m) => ({
      user: toUserCard(m.user),
      nickname: m.nickname ?? null,
    })),
  });
});

export const DELETE = authed(
  async (user, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const now = new Date();

    const updated = await prisma.conversationMember.updateMany({
      where: { conversationId: id, userId: user.id },
      data: { hiddenAt: now, clearedAt: now },
    });

    if (updated.count === 0) {
      return json({ error: "Conversation not found" }, 404);
    }

    return noContent();
  }
);
