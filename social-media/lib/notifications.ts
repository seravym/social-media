import type { NotificationDto, UserCard } from "@/lib/types";

export interface GroupedNotification {
  key: string;
  type: NotificationDto["type"];
  ids: string[];
  actors: UserCard[];
  postId: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATION_ACTION_TEXT: Record<NotificationDto["type"], string> = {
  like: "menyukai postinganmu",
  follow: "mulai mengikutimu",
  reply: "membalas postinganmu",
  mention: "menyebutmu",
  system: "Pembaruan sistem",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function dayBucket(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function groupNotifications(
  list: NotificationDto[],
): GroupedNotification[] {
  const map = new Map<string, GroupedNotification>();

  for (const item of list) {
    const canGroup = item.type === "like" || item.type === "follow";
    const key = canGroup
      ? `${item.type}:${item.postId ?? ""}:${item.message ?? ""}:${dayBucket(item.createdAt)}`
      : item.id;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        type: item.type,
        ids: [item.id],
        actors: item.actor ? [item.actor] : [],
        postId: item.postId ?? null,
        message: item.message,
        isRead: item.isRead,
        createdAt: item.createdAt,
      });
      continue;
    }

    existing.ids.push(item.id);
    if (item.actor && !existing.actors.some((a) => a.id === item.actor!.id)) {
      existing.actors.push(item.actor);
    }
    if (!item.isRead) existing.isRead = false;
    if (item.createdAt > existing.createdAt) {
      existing.createdAt = item.createdAt;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}