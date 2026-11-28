"use client";

import { useEffect, useState } from "react";

export function NotificationBadge({ className = "" }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;

    const refresh = () => {
      if (document.hidden) return;
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d) setUnread(d.unreadCount ?? 0);
        })
        .catch(() => undefined);
    };

    refresh();
    const interval = window.setInterval(refresh, 10000);
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };

    window.addEventListener("notifications-changed", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("notifications-changed", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (unread <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#b85c7a] px-1.5 text-[10px] font-bold leading-4 text-white ${className}`}
    >
      {unread > 9 ? "9+" : unread}
    </span>
  );
}