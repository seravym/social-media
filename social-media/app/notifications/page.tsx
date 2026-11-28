"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, SlidersHorizontal, X } from "lucide-react";
import type { NotificationDto } from "@/lib/types";
import {
  groupNotifications,
  NOTIFICATION_ACTION_TEXT,
  type GroupedNotification,
} from "@/lib/notifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";

type FilterTab = "all" | "unread" | "like" | "follow" | "reply";

interface ToastItem {
  id: string;
  title: string;
  subtitle?: string;
  undoIds?: string[];
}

interface TrendingItem {
  id: string;
  name: string;
  category?: string | null;
  postCount: number;
}

interface AccountItem {
  id: string;
  name: string | null;
  username: string;
}

const HIDDEN_KEY = "social_media_hidden_notifs_v1";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum dibaca" },
  { key: "like", label: "Suka" },
  { key: "follow", label: "Pengikut" },
  { key: "reply", label: "Balasan" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("all");
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(HIDDEN_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [toastEnabled, setToastEnabled] = useState(true);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((next: ToastItem) => {
    setToast(next);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4500);
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
          if (brandNew.length > 0 && toastEnabled) {
            const latest = brandNew[0];
            const action =
              NOTIFICATION_ACTION_TEXT[latest.type] ??
              NOTIFICATION_ACTION_TEXT.system;
            showToast({
              id: latest.id,
              title: latest.actor
                ? `${latest.actor.displayName} ${action}`
                : action,
              subtitle:
                brandNew.length > 1
                  ? `+${brandNew.length - 1} notifikasi baru lainnya`
                  : (latest.message ?? undefined),
            });
            window.dispatchEvent(new Event("notifications-changed"));
          }
        }

        for (const n of incoming) seenIdsRef.current.add(n.id);
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
    [showToast, toastEnabled],
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data && typeof data.notifyToast === "boolean") {
          setToastEnabled(data.notifyToast);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    void fetchNotifications(false);
    const interval = window.setInterval(() => {
      if (!document.hidden) void fetchNotifications(true);
    }, 8000);
    const onVisibility = () => {
      if (!document.hidden) void fetchNotifications(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/explore", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.trending) {
          setTrending((data.trending as TrendingItem[]).slice(0, 5));
        }
        if (data?.accounts) {
          setAccounts((data.accounts as AccountItem[]).slice(0, 3));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setExploreLoading(false);
      });
    return () => controller.abort();
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const visibleItems = useMemo(
    () => items.filter((n) => !hiddenSet.has(n.id)),
    [items, hiddenSet],
  );
  const unreadCount = useMemo(
    () => visibleItems.filter((n) => !n.isRead).length,
    [visibleItems],
  );

  const grouped = useMemo(() => {
    const filtered = visibleItems.filter((n) => {
      if (tab === "unread") return !n.isRead;
      if (tab === "like") return n.type === "like";
      if (tab === "follow") return n.type === "follow";
      if (tab === "reply") return n.type === "reply" || n.type === "mention";
      return true;
    });
    return groupNotifications(filtered);
  }, [visibleItems, tab]);

  const persistHidden = (next: string[]) => {
    setHiddenIds(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const handleOpenGroup = async (group: GroupedNotification) => {
    const idSet = new Set(group.ids);
    const unreadIds = items
      .filter((n) => idSet.has(n.id) && !n.isRead)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      setItems((prev) =>
        prev.map((n) => (idSet.has(n.id) ? { ...n, isRead: true } : n)),
      );
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(
            () => undefined,
          ),
        ),
      );
      window.dispatchEvent(new Event("notifications-changed"));
    }

    if (group.postId) router.push(`/post/${group.postId}`);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(
      () => undefined,
    );
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleHideGroup = (group: GroupedNotification) => {
    persistHidden(Array.from(new Set([...hiddenIds, ...group.ids])));
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
    <div className="bg-dot-canvas min-h-[calc(100dvh-4rem)] text-slate-900">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="glass-panel min-w-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Notifikasi
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Aktivitas terbaru dari postingan dan pengikutmu
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hiddenIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => persistHidden([])}
                  className="glass-chip rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white/85 hover:text-slate-900"
                >
                  Tampilkan ({hiddenIds.length})
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#faf0f3]/90 px-3 py-1.5 text-xs font-semibold text-[#9e4865] transition hover:bg-[#f4e2e8]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Tandai dibaca
                </button>
              )}
              <Link
                href="/settings/notifications"
                title="Preferensi notifikasi"
                className="glass-chip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white/85 hover:text-slate-900"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atur</span>
              </Link>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-b border-white/75 px-5 pb-3">
            {FILTER_TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[#faf0f3]/95 font-semibold text-[#9e4865] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  {label}
                  {key === "unread" && unreadCount > 0 && (
                    <span className="rounded-full bg-[#b85c7a] px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="divide-y divide-white/65 px-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3.5 py-4"
                >
                  <div className="h-10 w-10 rounded-full bg-white/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-white/70" />
                    <div className="h-3 w-1/3 rounded bg-white/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void fetchNotifications(false);
                }}
                className="mt-3 rounded-lg bg-[#b85c7a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#9e4865]"
              >
                Coba lagi
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="glass-chip mb-3 flex h-11 w-11 items-center justify-center rounded-full text-[#b85c7a]">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Belum ada notifikasi
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Suka, komentar, dan pengikut baru akan muncul di sini saat ada
                interaksi di akunmu.
              </p>
              <Link
                href="/explore"
                className="glass-chip mt-4 inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[#9e4865] transition hover:bg-white/85"
              >
                Jelajahi postingan
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/65">
              {grouped.map((group) => (
                <NotificationItem
                  key={group.key}
                  group={group}
                  onOpen={(g) => void handleOpenGroup(g)}
                  onProfileClick={(id) => router.push(`/profile/${id}`)}
                  onHide={handleHideGroup}
                />
              ))}
            </ul>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <section className="glass-panel overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/75 px-4 py-3.5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Trending
                </h2>
                <Link
                  href="/explore"
                  className="text-xs font-medium text-[#b85c7a] transition hover:text-[#9e4865]"
                >
                  Lihat semua
                </Link>
              </div>

              {exploreLoading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-white/70" />
                      <div className="h-2.5 w-1/3 rounded bg-white/50" />
                    </div>
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">
                  Belum ada topik trending saat ini.
                </p>
              ) : (
                <ul className="divide-y divide-white/65">
                  {trending.map((topic) => (
                    <li key={topic.id}>
                      <Link
                        href={`/explore?q=${encodeURIComponent(topic.name)}`}
                        className="block px-4 py-3 transition hover:bg-white/55"
                      >
                        <p className="truncate text-sm font-medium text-slate-900">
                          {topic.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {topic.category ? `${topic.category} · ` : ""}
                          {topic.postCount} postingan
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {accounts.length > 0 && (
              <section className="glass-panel overflow-hidden rounded-2xl">
                <div className="border-b border-white/75 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Mungkin kamu kenal
                  </h2>
                </div>
                <ul className="divide-y divide-white/65">
                  {accounts.map((acc) => {
                    const display = acc.name?.trim() || acc.username;
                    return (
                      <li key={acc.id}>
                        <Link
                          href={`/profile/${acc.id}`}
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/55"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#faf0f3] text-xs font-semibold text-[#9e4865]">
                            {display.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {display}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              @{acc.username}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed right-4 bottom-4 z-50 w-full max-w-xs">
          <div className="glass-panel flex items-center justify-between gap-3 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {toast.title}
              </p>
              {toast.subtitle && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {toast.subtitle}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {toast.undoIds && (
                <button
                  type="button"
                  onClick={() => handleUndoHide(toast.undoIds!)}
                  className="text-xs font-semibold text-[#b85c7a] hover:text-[#9e4865]"
                >
                  Urungkan
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Tutup"
                className="rounded p-1 text-slate-400 hover:bg-white/70 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}