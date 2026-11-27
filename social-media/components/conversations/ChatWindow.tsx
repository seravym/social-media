"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";
import { ChatHeader } from "@/components/conversations/ChatHeader";
import {
  MessageBubble,
  type ReplyTarget,
} from "@/components/conversations/MessageBubble";
import { StickerPicker } from "@/components/conversations/StickerPicker";
import { MessageAreaSkeleton } from "@/components/conversations/ChatSkeletons";

const PRESET_BACKGROUNDS: Record<string, string> = {
  pink: "bg-gradient-to-b from-pink-50/80 to-rose-50/60",
  ocean: "bg-gradient-to-b from-sky-50/80 to-cyan-50/60",
  lavender: "bg-gradient-to-b from-purple-50/80 to-pink-50/60",
  mint: "bg-gradient-to-b from-emerald-50/80 to-teal-50/60",
};

interface ChatWindowProps {
  name: string;
  subtitle: string;
  avatarUrl: string | null;
  currentUserId: string;
  isSelfNotes: boolean;
  loading: boolean;
  messages: ChatMessageDto[];
  background: string | null;
  vanishMode: boolean;
  initialDraft?: string;
  onClearInitialDraft?: () => void;
  onBack: () => void;
  onSendMessage: (body: string, imageUrl: string | null) => Promise<void>;
  onOpenMedia: () => void;
  onOpenSettings: () => void;
}

export function ChatWindow({
  name,
  subtitle,
  avatarUrl,
  currentUserId,
  isSelfNotes,
  loading,
  messages,
  background,
  vanishMode,
  initialDraft = "",
  onClearInitialDraft,
  onBack,
  onSendMessage,
  onOpenMedia,
  onOpenSettings,
}: ChatWindowProps) {
  const [text, setText] = useState(initialDraft);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyMap, setReplyMap] = useState<Record<string, ReplyTarget>>({});
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessageDto | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReact = (messageId: string, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === emoji ? "" : emoji,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;

    const currentReply = replyTarget;
    const currentImage = imagePreview;

    setText("");
    setImagePreview(null);
    setReplyTarget(null);
    if (onClearInitialDraft) {
      onClearInitialDraft();
    }

    if (currentReply) {
      const tempKey = `${Date.now()}`;
      setReplyMap((prev) => ({ ...prev, [tempKey]: currentReply }));
    }

    onSendMessage(trimmed, currentImage);
  };

  const handleSendSticker = async (stickerText: string) => {
    if (sending) return;
    setSending(true);
    try {
      await onSendMessage(stickerText, null);
    } finally {
      setSending(false);
    }
  };

  const presetClass = background ? PRESET_BACKGROUNDS[background] : undefined;
  const isCustomImageBg =
    background &&
    (background.startsWith("http://") ||
      background.startsWith("https://") ||
      background.startsWith("data:image/"));

  const containerStyle = vanishMode
    ? undefined
    : isCustomImageBg
      ? {
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : background && !presetClass
        ? { background }
        : undefined;

  return (
    <div
      style={containerStyle}
      className={`relative flex flex-1 flex-col overflow-hidden ${
        vanishMode
          ? "bg-slate-950 text-slate-100"
          : presetClass ?? "bg-slate-50/60"
      }`}
    >
      <ChatHeader
        name={name}
        subtitle={subtitle}
        avatarUrl={avatarUrl}
        isSelfNotes={isSelfNotes}
        vanishMode={vanishMode}
        pinnedMessage={pinnedMessage}
        onBack={onBack}
        onUnpin={() => setPinnedMessage(null)}
        onOpenMedia={onOpenMedia}
        onOpenSettings={onOpenSettings}
      />

      {loading ? (
        <MessageAreaSkeleton />
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length > 0 && (
            <div className="flex justify-center">
              <span
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium ${
                  vanishMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                Hari Ini
              </span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <p
                className={`text-sm font-medium ${
                  vanishMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Belum ada pesan
              </p>
              <p
                className={`mt-1 text-xs ${
                  vanishMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Mulai percakapan dengan mengirim pesan atau gambar
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={isSelfNotes || msg.senderId === currentUserId}
                reaction={reactions[msg.id]}
                replyTo={replyMap[msg.id]}
                isPinned={pinnedMessage?.id === msg.id}
                vanishMode={vanishMode}
                onReact={handleReact}
                onReply={(m) => setReplyTarget({ id: m.id, body: m.body })}
                onPin={(m) =>
                  setPinnedMessage((prev) => (prev?.id === m.id ? null : m))
                }
              />
            ))
          )}
        </div>
      )}

      <div
        className={`border-t px-4 py-3 ${
          vanishMode
            ? "border-slate-800 bg-slate-900"
            : "border-slate-100 bg-white"
        }`}
      >
        {replyTarget && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-pink-200 bg-pink-50/70 px-3 py-1.5 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-pink-600">Membalas: </span>
              <span className="truncate text-slate-600">
                {replyTarget.body || "Pesan gambar"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="mb-2 inline-flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <Image
              src={imagePreview}
              alt="Preview"
              width={64}
              height={64}
              unoptimized
              className="h-14 w-14 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Kirim Gambar"
            className={`rounded-lg p-2 transition ${
              vanishMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setShowStickers((prev) => !prev)}
            title="Stiker"
            className={`rounded-lg p-2 transition ${
              vanishMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {showStickers && (
            <StickerPicker
              onSelect={handleSendSticker}
              onClose={() => setShowStickers(false)}
            />
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              vanishMode ? "Ketik pesan vanish mode..." : "Tulis pesan..."
            }
            className={`flex-1 rounded-xl border px-3.5 py-2 text-sm outline-none transition ${
              vanishMode
                ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pink-500"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:bg-white"
            }`}
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !imagePreview)}
            className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "Kirim"}
          </button>
        </form>
      </div>
    </div>
  );
}