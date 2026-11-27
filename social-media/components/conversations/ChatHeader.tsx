"use client";

import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";

interface ChatHeaderProps {
  name: string;
  subtitle: string;
  avatarUrl: string | null;
  isSelfNotes: boolean;
  vanishMode: boolean;
  pinnedMessage: ChatMessageDto | null;
  onBack: () => void;
  onUnpin: () => void;
  onOpenMedia: () => void;
  onOpenSettings: () => void;
}

export function ChatHeader({
  name,
  subtitle,
  avatarUrl,
  isSelfNotes,
  vanishMode,
  pinnedMessage,
  onBack,
  onUnpin,
  onOpenMedia,
  onOpenSettings,
}: ChatHeaderProps) {
  return (
    <div className="relative z-10">
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          vanishMode
            ? "border-slate-800 bg-slate-900/85 text-slate-100 backdrop-blur-md"
            : "border-white/75 bg-white/45 text-slate-900 backdrop-blur-md"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`rounded-lg px-2 py-1 text-xs font-medium md:hidden ${
              vanishMode
                ? "text-slate-300 hover:bg-slate-800"
                : "text-slate-600 hover:bg-white/70"
            }`}
          >
            Back
          </button>

          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={38}
              height={38}
              unoptimized
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                vanishMode
                  ? "bg-slate-800 text-slate-200"
                  : "glass-chip text-slate-700"
              }`}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{name}</p>
              {vanishMode && (
                <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                  Vanish
                </span>
              )}
            </div>
            <p
              className={`truncate text-xs ${
                vanishMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMedia}
            title="Galeri Media"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              vanishMode
                ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "glass-chip text-slate-700 hover:bg-white/85"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>Media</span>
          </button>

          {!isSelfNotes && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                vanishMode
                  ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "glass-chip text-slate-700 hover:bg-white/85"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Atur</span>
            </button>
          )}
        </div>
      </div>

      {pinnedMessage && (
        <div
          className={`flex items-center justify-between gap-2 border-b px-4 py-2 text-xs backdrop-blur-md ${
            vanishMode
              ? "border-slate-800 bg-slate-900/80 text-slate-200"
              : "border-white/75 bg-white/55 text-slate-700"
          }`}
        >
          <p className="truncate font-medium">
            Disematkan: {pinnedMessage.body || "Pesan gambar"}
          </p>
          <button
            type="button"
            onClick={onUnpin}
            className={`shrink-0 text-[11px] font-semibold hover:underline ${
              vanishMode ? "text-slate-300" : "text-slate-900"
            }`}
          >
            Lepas
          </button>
        </div>
      )}
    </div>
  );
}