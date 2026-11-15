"use client";

import { useEffect, useState } from "react";

export function NotificationBadge({ className = "" }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d) setUnread(d.unreadCount ?? 0);
        })
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener("notifications-changed", refresh);
    return () => {
      alive = false;
      window.removeEventListener("notifications-changed", refresh);
    };
  }, []);

  if (unread <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-white ${className}`}
    >
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
