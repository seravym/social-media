"use client";

import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";

interface ChatHeaderProps {
  name: string;
  subtitle: string;
  avatarUrl: string | null;
  isSelfNotes: boolean;
  isTyping: boolean;
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
  isTyping,
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
            ? "border-slate-800 bg-slate-900/95 text-slate-100"
            : "border-slate-100 bg-white/95 text-slate-900"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`rounded-full px-2.5 py-1 text-sm font-medium md:hidden ${
              vanishMode
                ? "text-slate-300 hover:bg-slate-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            ← Back
          </button>

          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
              {isSelfNotes ? "📝" : name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{name}</p>
              {vanishMode && (
                <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold text-pink-300">
                  Vanish
                </span>
              )}
            </div>
            <p
              className={`truncate text-xs ${
                isTyping
                  ? "font-medium text-pink-500"
                  : vanishMode
                    ? "text-slate-400"
                    : "text-slate-500"
              }`}
            >
              {isTyping ? "Sedang mengetik..." : subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMedia}
            title="Galeri Bersama"
            className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
              vanishMode
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            🖼️ Media
          </button>
          {!isSelfNotes && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan Obrolan"
              className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                vanishMode
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100"
              }`}
            >
              ⚙️ Atur
            </button>
          )}
        </div>
      </div>

      {pinnedMessage && (
        <div
          className={`mx-3 mt-2 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs shadow-xs ${
            vanishMode
              ? "border-slate-700 bg-slate-800/95 text-slate-200"
              : "border-pink-200 bg-pink-50/95 text-slate-700"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span>📌</span>
            <p className="truncate font-medium">
              {pinnedMessage.body || "Pesan gambar disematkan"}
            </p>
          </div>
          <button
            type="button"
            onClick={onUnpin}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-pink-600 hover:bg-pink-100"
          >
            Lepas
          </button>
        </div>
      )}
    </div>
  );
}
