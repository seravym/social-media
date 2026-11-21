"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationDto } from "@/lib/types";

type Tab = "all" | "unread";

const TYPE_STYLES: Record<
  NotificationDto["type"],
  { icon: string; label: string; color: string }
> = {
  like: { icon: "❤️", label: "liked your post", color: "#e0245e" },
  follow: { icon: "➕", label: "followed you", color: "#1d9bf0" },
  reply: { icon: "💬", label: "replied to your post", color: "#00ba7c" },
  mention: { icon: "📣", label: "mentioned you", color: "#7c3aed" },
  system: { icon: "🔔", label: "", color: "#f59e0b" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/notifications?tab=${tab}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      })
      .then((data) => {
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setError(null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tab]);

  const handleTabChange = (next: Tab) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
  };

  const handleMarkRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleClick = (n: NotificationDto) => {
    if (!n.isRead) handleMarkRead(n.id);
  };

  return (
    <div className="mx-auto min-h-dvh w-full px-0 py-0 sm:max-w-2xl sm:px-4 sm:py-8">
      <nav className="mb-4 hidden gap-4 px-4 text-sm sm:flex sm:px-0">
        <a href="/home" className="text-accent hover:underline">Home</a>
        <a href="/communities" className="text-accent hover:underline">Communities</a>
      </nav>

      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:border-b-0 sm:px-0 sm:py-0">
        <h1 className="text-xl font-bold sm:text-2xl">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover sm:px-4 sm:text-sm"
          >
            Mark all read
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-10 mt-0 flex border-b border-line bg-background/95 backdrop-blur sm:mt-4">
        {(
          [
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent-soft sm:text-base ${
              tab === key
                ? "border-b-2 border-accent text-accent"
                : "text-muted"
            }`}
          >
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : error ? (
        <p className="py-10 px-4 text-center text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <div className="py-16 px-4 text-center text-muted">
          <p className="text-4xl">🔔</p>
          <p className="mt-2 font-semibold">No notifications yet</p>
          <p className="text-sm">Likes, follows, and replies will show up here.</p>
        </div>
      ) : (
        <ul>
          {items.map((n) => {
            const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.system;
            return (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 border-b border-line px-4 py-3 transition-colors sm:py-4 ${
                  n.isRead ? "bg-surface" : "bg-accent-soft"
                } hover:bg-accent-soft/50`}
              >
                {/* Avatar */}
                <Avatar
                  name={n.actor?.displayName ?? "S"}
                  url={n.actor?.avatarUrl ?? null}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground sm:text-base">
                    {n.actor ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${n.actor!.id}`);
                        }}
                        className="font-semibold hover:underline"
                      >
                        {n.actor.displayName}
                      </button>
                    ) : (
                      <span className="font-semibold">Someone</span>
                    )}{" "}
                    <span className="text-muted">{style.label}</span>
                  </p>
                  {n.message && (
                    <p className="mt-0.5 truncate text-sm text-muted">{n.message}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
