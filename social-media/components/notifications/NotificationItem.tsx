"use client";

import Image from "next/image";
import { AtSign, Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import type { NotificationDto } from "@/lib/types";
import {
  NOTIFICATION_ACTION_TEXT,
  timeAgo,
  type GroupedNotification,
} from "@/lib/notifications";

interface NotificationItemProps {
  group: GroupedNotification;
  onOpen: (group: GroupedNotification) => void;
  onProfileClick: (userId: string) => void;
  onHide: (group: GroupedNotification) => void;
}

const TYPE_ICON_STYLE: Record<
  NotificationDto["type"],
  { Icon: typeof Bell; className: string }
> = {
  like: { Icon: Heart, className: "bg-[#faf0f3] text-[#b85c7a]" },
  follow: { Icon: UserPlus, className: "bg-sky-50 text-sky-600" },
  reply: { Icon: MessageCircle, className: "bg-emerald-50 text-emerald-600" },
  mention: { Icon: AtSign, className: "bg-violet-50 text-violet-600" },
  system: { Icon: Bell, className: "bg-amber-50 text-amber-600" },
};

export function NotificationItem({
  group,
  onOpen,
  onProfileClick,
  onHide,
}: NotificationItemProps) {
  const { Icon, className } =
    TYPE_ICON_STYLE[group.type] ?? TYPE_ICON_STYLE.system;
  const actionText =
    NOTIFICATION_ACTION_TEXT[group.type] ?? NOTIFICATION_ACTION_TEXT.system;
  const primary = group.actors[0];
  const extraCount = Math.max(0, group.actors.length - 1);

  return (
    <li
      onClick={() => onOpen(group)}
      className={`group flex cursor-pointer items-start gap-3.5 px-5 py-3.5 transition ${
        group.isRead
          ? "hover:bg-white/60"
          : "bg-[#faf0f3]/55 hover:bg-[#faf0f3]/80"
      }`}
    >
      {primary ? (
        <div className="relative h-10 w-10 shrink-0">
          {primary.avatarUrl ? (
            <Image
              src={primary.avatarUrl}
              alt={primary.displayName}
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-lg border border-white/80 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/80 bg-[#faf0f3] text-sm font-semibold text-[#b85c7a]">
              {primary.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className={`absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border border-white ${className}`}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        </div>
      ) : (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/80 ${className}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-slate-800">
          {primary ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onProfileClick(primary.id);
              }}
              className="font-semibold text-slate-900 hover:underline"
            >
              {primary.displayName}
            </button>
          ) : (
            <span className="font-semibold text-slate-900">Sistem</span>
          )}
          {extraCount > 0 && (
            <span className="font-medium text-slate-700">
              {" "}
              dan {extraCount} lainnya
            </span>
          )}{" "}
          <span className="text-slate-600">{actionText}</span>
        </p>

        {group.message && (
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {group.message}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span className="text-[11px] font-medium text-slate-400">
          {timeAgo(group.createdAt)}
        </span>
        {!group.isRead && (
          <span className="h-2 w-2 rounded-full bg-[#b85c7a]" />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHide(group);
          }}
          title="Sembunyikan notifikasi"
          aria-label="Sembunyikan notifikasi"
          className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/85 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}