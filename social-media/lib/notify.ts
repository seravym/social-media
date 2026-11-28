import { prisma } from "@/lib/prisma";

export type NotificationKind =
  | "like"
  | "follow"
  | "reply"
  | "mention"
  | "system";

const PREFERENCE_BY_KIND: Partial<
  Record<NotificationKind, "notifyLikes" | "notifyFollows" | "notifyReplies">
> = {
  like: "notifyLikes",
  follow: "notifyFollows",
  reply: "notifyReplies",
  mention: "notifyReplies",
};

interface NotifyInput {
  userId: string;
  actorId?: string | null;
  type: NotificationKind;
  postId?: string | null;
  message?: string | null;
}

/**
 * Creates a notification only when the recipient has not disabled the
 * matching preference. Missing settings rows fall back to the schema
 * defaults (enabled).
 */
export async function notifyUser({
  userId,
  actorId = null,
  type,
  postId = null,
  message = null,
}: NotifyInput) {
  if (!userId) return null;
  if (actorId && actorId === userId) return null;

  try {
    const preference = PREFERENCE_BY_KIND[type];
    if (preference) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          notifyLikes: true,
          notifyFollows: true,
          notifyReplies: true,
        },
      });
      if (settings && !settings[preference]) return null;
    }

    const existing = await prisma.notification.findFirst({
      where: { userId, actorId, type, postId },
      select: { id: true },
    });
    if (existing) return existing;

    return await prisma.notification.create({
      data: { userId, actorId, type, postId, message },
      select: { id: true },
    });
  } catch (error) {
    // Notifications are best-effort: never fail the action that triggered them.
    console.error("notifyUser failed:", error);
    return null;
  }
}

/**
 * Removes the notification that was created for a reversible action
 * (unlike / unfollow).
 */
export async function clearNotification({
  userId,
  actorId,
  type,
  postId = null,
}: {
  userId: string;
  actorId: string;
  type: NotificationKind;
  postId?: string | null;
}) {
  try {
    await prisma.notification.deleteMany({
      where: { userId, actorId, type, postId },
    });
  } catch (error) {
    console.error("clearNotification failed:", error);
  }
}
