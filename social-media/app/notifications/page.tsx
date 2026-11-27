"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotificationDto, UserCard } from "@/lib/types";

type FilterTab = "all" | "unread" | "like" | "follow" | "reply";

interface GroupedNotification {
  key: string;
  type: NotificationDto["type"];
  ids: string[];
  actors: UserCard[];
  postId: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  subtitle?: string;
  undoIds?: string[];
}

const HIDDEN_STORAGE_KEY = "social_media_hidden_notifs_v1";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum Dibaca" },
  { key: "like", label: "Suka" },
  { key: "follow", label: "Pengikut" },
  { key: "reply", label: "Balasan" },
];

const TYPE_META: Record<
  NotificationDto["type"],
  { actionText: string; badgeBg: string; badgeText: string }
> = {
  like: {
    actionText: "menyukai postinganmu",
    badgeBg: "bg-[#faf0f3]",
    badgeText: "text-[#b85c7a]",
  },
  follow: {
    actionText: "mulai mengikutimu",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
  },
  reply: {
    actionText: "membalas postinganmu",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
  },
  mention: {
    actionText: "menyebutmu",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-600",
  },
  system: {
    actionText: "Pembaruan sistem",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
  },
};

function TypeIcon({
  type,
  className = "h-4 w-4",
}: {
  type: NotificationDto["type"];
  className?: string;
}) {
  switch (type) {
    case "like":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "follow":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "reply":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "mention":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </svg>
      );
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function dayBucket(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupNotifications(list: NotificationDto[]): GroupedNotification[] {
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
    } else {
      existing.ids.push(item.id);
      if (
        item.actor &&
        !existing.actors.some((a) => a.id === item.actor!.id)
      ) {
        existing.actors.push(item.actor);
      }
      if (!item.isRead) existing.isRead = false;
      if (item.createdAt > existing.createdAt) {
        existing.createdAt = item.createdAt;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

function LeadingTile({
  type,
  actors,
  size = "md",
}: {
  type: NotificationDto["type"];
  actors: UserCard[];
  size?: "sm" | "md";
}) {
  const meta = TYPE_META[type] ?? TYPE_META.system;
  const primary = actors[0];
  const boxClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const px = size === "sm" ? 36 : 44;

  if (!primary) {
    return (
      <div
        className={`flex ${boxClass} shrink-0 items-center justify-center rounded-xl border border-white/80 ${meta.badgeBg} ${meta.badgeText}`}
      >
        <TypeIcon type={type} className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </div>
    );
  }

  return (
    <div className={`relative ${boxClass} shrink-0`}>
      {primary.avatarUrl ? (
        <Image
          src={primary.avatarUrl}
          alt={primary.displayName}
          width={px}
          height={px}
          unoptimized
          className={`${boxClass} rounded-xl border border-white/80 object-cover`}
        />
      ) : (
        <div
          className={`flex ${boxClass} items-center justify-center rounded-xl border border-white/80 bg-[#faf0f3] text-sm font-semibold text-[#b85c7a]`}
        >
          {primary.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {size === "md" && (
        <span
          className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-2xs ${meta.badgeBg} ${meta.badgeText}`}
        >
          <TypeIcon type={type} className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("all");
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(HIDDEN_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [clock, setClock] = useState<{
    time: string;
    month: string;
    day: string;
  } | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        month: now.toLocaleDateString("id-ID", { month: "short" }),
        day: String(now.getDate()),
      });
    };
    const initial = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  const showToast = useCallback((next: ToastItem) => {
    setToast(next);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const fetchNotifications = useCallback(
    async (isPoll = false) => {
      try {
        const res = await fetch("/api/notifications?tab=all", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!isPoll) throw new Error("Gagal memuat notifikasi.");
          return;
        }
        const data = await res.json();
        const incoming: NotificationDto[] = data.items ?? [];

        if (initializedRef.current && isPoll) {
          const brandNew = incoming.filter(
            (n) => !seenIdsRef.current.has(n.id) && !n.isRead,
          );
          if (brandNew.length > 0) {
            const latest = brandNew[0];
            const meta = TYPE_META[latest.type] ?? TYPE_META.system;
            showToast({
              id: latest.id,
              title: latest.actor
                ? `${latest.actor.displayName} ${meta.actionText}`
                : meta.actionText,
              subtitle:
                brandNew.length > 1
                  ? `+${brandNew.length - 1} notifikasi baru lainnya`
                  : (latest.message ?? undefined),
            });
            window.dispatchEvent(new Event("notifications-changed"));
          }
        }

        for (const n of incoming) {
          seenIdsRef.current.add(n.id);
        }
        initializedRef.current = true;
        setItems(incoming);
        setError(null);
      } catch (e) {
        if (!isPoll) {
          setError(
            e instanceof Error ? e.message : "Terjadi kesalahan saat memuat.",
          );
        }
      } finally {
        if (!isPoll) setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void fetchNotifications(false);

    const interval = window.setInterval(() => {
      if (!document.hidden) void fetchNotifications(true);
    }, 8000);

    const handleVisibility = () => {
      if (!document.hidden) void fetchNotifications(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchNotifications]);

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const visibleItems = useMemo(
    () => items.filter((n) => !hiddenSet.has(n.id)),
    [items, hiddenSet],
  );

  const unreadCount = useMemo(
    () => visibleItems.filter((n) => !n.isRead).length,
    [visibleItems],
  );

  const countsByType = useMemo(() => {
    let like = 0;
    let follow = 0;
    let reply = 0;
    for (const n of visibleItems) {
      if (n.type === "like") like += 1;
      else if (n.type === "follow") follow += 1;
      else if (n.type === "reply" || n.type === "mention") reply += 1;
    }
    return { like, follow, reply };
  }, [visibleItems]);

  const filteredItems = useMemo(() => {
    switch (tab) {
      case "unread":
        return visibleItems.filter((n) => !n.isRead);
      case "like":
        return visibleItems.filter((n) => n.type === "like");
      case "follow":
        return visibleItems.filter((n) => n.type === "follow");
      case "reply":
        return visibleItems.filter(
          (n) => n.type === "reply" || n.type === "mention",
        );
      default:
        return visibleItems;
    }
  }, [visibleItems, tab]);

  const grouped = useMemo(
    () => groupNotifications(filteredItems),
    [filteredItems],
  );

  const recentPreview = useMemo(
    () => groupNotifications(visibleItems).slice(0, 4),
    [visibleItems],
  );

  const persistHidden = (next: string[]) => {
    setHiddenIds(next);
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const handleMarkGroupRead = async (ids: string[]) => {
    const idSet = new Set(ids);
    const unreadTargetIds = items
      .filter((n) => idSet.has(n.id) && !n.isRead)
      .map((n) => n.id);
    if (unreadTargetIds.length === 0) return;

    setItems((prev) =>
      prev.map((n) => (idSet.has(n.id) ? { ...n, isRead: true } : n)),
    );

    await Promise.all(
      unreadTargetIds.map((id) =>
        fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(
          () => undefined,
        ),
      ),
    );
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleOpenGroup = async (group: GroupedNotification) => {
    await handleMarkGroupRead(group.ids);
    if (group.postId) {
      router.push(`/post/${group.postId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(
      () => undefined,
    );
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleHideGroup = (e: React.MouseEvent, group: GroupedNotification) => {
    e.stopPropagation();
    const next = Array.from(new Set([...hiddenIds, ...group.ids]));
    persistHidden(next);
    showToast({
      id: `hide_${group.key}`,
      title: "Notifikasi disembunyikan",
      undoIds: group.ids,
    });
  };

  const handleUndoHide = (undoIds: string[]) => {
    const removeSet = new Set(undoIds);
    persistHidden(hiddenIds.filter((id) => !removeSet.has(id)));
    setToast(null);
  };

  return (
    <div className="bg-dot-canvas min-h-dvh px-3 py-4 text-slate-900 sm:px-5 sm:py-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[224px_minmax(0,1fr)_272px]">
        <aside className="flex flex-col justify-between gap-4 lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)]">
          <div className="glass-panel rounded-2xl p-3">
            <div className="mb-3 flex items-center justify-between px-2 pt-1">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Menu
              </span>
              <Link
                href="/settings"
                aria-label="Pengaturan"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/75 hover:text-slate-700"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
            </div>

            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              <Link
                href="/home"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-900"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Beranda
              </Link>

              <Link
                href="/explore"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-900"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Jelajahi
              </Link>

              <Link
                href="/notifications"
                className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-[#b85c7a]/25 bg-[#faf0f3]/85 px-3 py-2 text-xs font-semibold text-[#9e4865]"
              >
                <span className="flex items-center gap-2.5">
                  <TypeIcon type="like" className="h-4 w-4 text-[#b85c7a]" />
                  Notifikasi
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#b85c7a] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/conversations"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-900"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Pesan
              </Link>

              <Link
                href="/communities"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-900"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Komunitas
              </Link>

              <Link
                href="/settings"
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-900"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Pengaturan
              </Link>
            </nav>
          </div>

          {clock && (
            <div className="hidden items-center gap-2 lg:flex">
              <div className="glass-panel flex flex-1 items-baseline justify-between rounded-2xl px-4 py-3">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {clock.time}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  WIB
                </span>
              </div>
              <div className="glass-panel flex flex-col items-center justify-center rounded-2xl px-3.5 py-2">
                <span className="text-[10px] font-semibold uppercase text-[#b85c7a]">
                  {clock.month}
                </span>
                <span className="text-base leading-tight font-bold text-slate-900">
                  {clock.day}
                </span>
              </div>
            </div>
          )}
        </aside>

        <main className="glass-panel flex min-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-2xl">
          <header className="border-b border-white/70 px-5 pt-5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Notifikasi
                </h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#b85c7a] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hiddenIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => persistHidden([])}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/80 hover:text-[#b85c7a]"
                  >
                    Tampilkan ({hiddenIds.length})
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c7a] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#9e4865]"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Tandai dibaca
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {FILTER_TABS.map(({ key, label }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-[#b85c7a] text-white shadow-xs"
                        : "glass-chip text-slate-600 hover:bg-white/90 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="flex-1 p-2.5">
            {loading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="flex animate-pulse items-center gap-3.5 rounded-xl bg-white/50 p-3"
                  >
                    <div className="h-11 w-11 rounded-xl bg-slate-200/80" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 rounded-md bg-slate-200/80" />
                      <div className="h-3 w-1/4 rounded-md bg-slate-200/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-700">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void fetchNotifications(false);
                  }}
                  className="rounded-xl bg-[#b85c7a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#9e4865]"
                >
                  Coba lagi
                </button>
              </div>
            ) : grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="glass-chip mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400">
                  <TypeIcon type="system" className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Belum ada notifikasi
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Aktivitas suka, pengikut baru, dan balasan akan muncul di sini.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {grouped.map((group) => {
                  const meta = TYPE_META[group.type] ?? TYPE_META.system;
                  const primaryActor = group.actors[0];
                  const extraCount = Math.max(0, group.actors.length - 1);

                  return (
                    <li
                      key={group.key}
                      onClick={() => void handleOpenGroup(group)}
                      className={`group flex cursor-pointer items-center gap-3.5 rounded-xl px-3.5 py-3 transition ${
                        group.isRead
                          ? "hover:bg-white/70"
                          : "border border-[#b85c7a]/20 bg-[#faf0f3]/65 hover:bg-[#faf0f3]/90"
                      }`}
                    >
                      <LeadingTile type={group.type} actors={group.actors} />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-slate-800">
                          {primaryActor ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${primaryActor.id}`);
                              }}
                              className="font-semibold text-slate-900 hover:underline"
                            >
                              {primaryActor.displayName}
                            </button>
                          ) : (
                            <span className="font-semibold text-slate-900">
                              Sistem
                            </span>
                          )}
                          {extraCount > 0 && (
                            <span className="font-medium text-slate-700">
                              {" "}
                              dan {extraCount} lainnya
                            </span>
                          )}{" "}
                          <span className="text-slate-600">
                            {meta.actionText}
                          </span>
                        </p>

                        {group.message && (
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {group.message}
                          </p>
                        )}

                        <p className="mt-1 text-[11px] font-medium text-slate-400">
                          {timeAgo(group.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {!group.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#b85c7a]" />
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleHideGroup(e, group)}
                          title="Sembunyikan notifikasi"
                          aria-label="Sembunyikan notifikasi"
                          className="rounded-lg p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/90 hover:text-slate-700"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>

                        <svg
                          className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>

        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="glass-panel rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Ringkasan
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {visibleItems.length} total
              </span>
            </div>

            <div className="space-y-1.5">
              {(
                [
                  {
                    key: "like",
                    label: "Suka",
                    count: countsByType.like,
                    icon: "like" as const,
                  },
                  {
                    key: "follow",
                    label: "Pengikut",
                    count: countsByType.follow,
                    icon: "follow" as const,
                  },
                  {
                    key: "reply",
                    label: "Balasan",
                    count: countsByType.reply,
                    icon: "reply" as const,
                  },
                ] as const
              ).map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setTab(row.key)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                    tab === row.key
                      ? "bg-[#faf0f3] font-semibold text-[#9e4865]"
                      : "hover:bg-white/75 text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${TYPE_META[row.icon].badgeBg} ${TYPE_META[row.icon].badgeText}`}
                    >
                      <TypeIcon type={row.icon} className="h-3.5 w-3.5" />
                    </span>
                    {row.label}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {row.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Terbaru</h2>
              <button
                type="button"
                onClick={() => setTab("unread")}
                aria-label="Lihat belum dibaca"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/75 hover:text-slate-700"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            {recentPreview.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                Belum ada aktivitas terbaru.
              </p>
            ) : (
              <div className="space-y-2">
                {recentPreview.map((group) => {
                  const meta = TYPE_META[group.type] ?? TYPE_META.system;
                  const actorName = group.actors[0]?.displayName ?? "Sistem";
                  return (
                    <button
                      key={`preview-${group.key}`}
                      type="button"
                      onClick={() => void handleOpenGroup(group)}
                      className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-white/70"
                    >
                      <LeadingTile
                        type={group.type}
                        actors={group.actors}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800">
                          {actorName} {meta.actionText}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {timeAgo(group.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed right-4 bottom-4 z-50 w-full max-w-xs">
          <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl border border-white/85 px-4 py-3 shadow-lg">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {toast.title}
              </p>
              {toast.subtitle && (
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {toast.subtitle}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {toast.undoIds && (
                <button
                  type="button"
                  onClick={() => handleUndoHide(toast.undoIds!)}
                  className="rounded-lg bg-[#faf0f3] px-2.5 py-1 text-[11px] font-semibold text-[#9e4865] transition hover:bg-[#f3dce4]"
                >
                  Urungkan
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Tutup"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}