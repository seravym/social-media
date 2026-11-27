"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Compass,
  Home,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
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

const HIDDEN_KEY = "social_media_hidden_notifs_v1";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum Dibaca" },
  { key: "like", label: "Suka" },
  { key: "follow", label: "Pengikut" },
  { key: "reply", label: "Balasan" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("all");
  const [items, setItems] = useState<NotificationDto[]>([]);
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
          if (brandNew.length > 0) {
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
    [showToast],
  );

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

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const visibleItems = useMemo(
    () => items.filter((n) => !hiddenSet.has(n.id)),
    [items, hiddenSet],
  );
  const unreadCount = useMemo(
    () => visibleItems.filter((n) => !n.isRead).length,
    [visibleItems],
  );

  const summary = useMemo(() => {
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
    <div className="bg-dot-canvas min-h-dvh text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/75 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <Link
            href="/home"
            className="text-sm font-bold tracking-tight text-slate-900"
          >
            Social
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
            <Link
              href="/home"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <Home className="h-3.5 w-3.5" />
              Beranda
            </Link>
            <Link
              href="/explore"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <Compass className="h-3.5 w-3.5" />
              Jelajahi
            </Link>
            <Link
              href="/conversations"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Pesan
            </Link>
            <Link
              href="/notifications"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#faf0f3] px-3 py-1.5 font-semibold text-[#9e4865]"
            >
              <Bell className="h-3.5 w-3.5 text-[#b85c7a]" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#b85c7a] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/communities"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:flex"
            >
              <Users className="h-3.5 w-3.5" />
              Komunitas
            </Link>
          </nav>

          <Link
            href="/settings"
            aria-label="Pengaturan"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100/80 hover:text-slate-900"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
            <h1 className="text-base font-bold text-slate-900">Notifikasi</h1>
            <div className="flex items-center gap-3 text-xs">
              {hiddenIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => persistHidden([])}
                  className="font-medium text-slate-500 transition hover:text-[#b85c7a]"
                >
                  Tampilkan ({hiddenIds.length})
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 font-semibold text-[#b85c7a] transition hover:text-[#9e4865]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Tandai dibaca
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-5 overflow-x-auto border-b border-white/75 px-5">
            {FILTER_TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`shrink-0 border-b-2 py-2.5 text-xs font-medium transition ${
                    active
                      ? "border-[#b85c7a] font-semibold text-[#9e4865]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="divide-y divide-white/60">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3.5 px-5 py-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-200/80" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-slate-200/80" />
                    <div className="h-3 w-1/3 rounded bg-slate-200/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void fetchNotifications(false);
                }}
                className="rounded-lg bg-[#b85c7a] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#9e4865]"
              >
                Coba lagi
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Bell className="mb-2.5 h-6 w-6 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                Belum ada notifikasi
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Suka, pengikut baru, dan balasan akan muncul di sini.
              </p>
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
          <div className="glass-panel sticky top-16 overflow-hidden rounded-2xl">
            <div className="border-b border-white/75 px-4 py-3">
              <h2 className="text-xs font-semibold text-slate-900">
                Ringkasan Aktivitas
              </h2>
            </div>
            <div className="divide-y divide-white/65 text-xs">
              {(
                [
                  { key: "unread", label: "Belum dibaca", count: unreadCount },
                  { key: "like", label: "Suka", count: summary.like },
                  { key: "follow", label: "Pengikut baru", count: summary.follow },
                  { key: "reply", label: "Balasan & sebutan", count: summary.reply },
                ] as const
              ).map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setTab(row.key)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                    tab === row.key
                      ? "bg-[#faf0f3]/70 font-semibold text-[#9e4865]"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-slate-800">
                    {row.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed right-4 bottom-4 z-50 w-full max-w-xs">
          <div className="glass-panel flex items-center justify-between gap-3 rounded-xl border border-white/85 px-3.5 py-2.5 shadow-lg">
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
                  className="text-xs font-semibold text-[#b85c7a] hover:text-[#9e4865]"
                >
                  Urungkan
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Tutup"
                className="rounded p-1 text-slate-400 hover:bg-white/80 hover:text-slate-700"
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