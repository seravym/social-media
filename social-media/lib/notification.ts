import { prisma } from "./prisma";

export async function notification(input: {
  userId: string;
  actorId: string | null;
  type: "like" | "follow" | "reply" | "mention" | "system";
  postId?: string;
  message?: string;
}) {
  if (input.actorId && input.actorId === input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId ?? null,
      message: input.message ?? null,
    },
  });
}