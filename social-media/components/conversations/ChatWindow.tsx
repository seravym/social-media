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
  pink: "bg-gradient-to-b from-pink-50 to-rose-50",
  ocean: "bg-gradient-to-b from-sky-50 to-cyan-50",
  lavender: "bg-gradient-to-b from-purple-50 to-pink-50",
  mint: "bg-gradient-to-b from-emerald-50 to-teal-50",
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
  const [isTyping, setIsTyping] = useState(false);
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
    if (sending) return;

    setSending(true);
    try {
      const currentReply = replyTarget;
      await onSendMessage(trimmed, imagePreview);
      if (currentReply) {
        const tempKey = `${Date.now()}`;
        setReplyMap((prev) => ({ ...prev, [tempKey]: currentReply }));
      }
      setText("");
      setImagePreview(null);
      setReplyTarget(null);
      setIsTyping(false);
      if (onClearInitialDraft) {
        onClearInitialDraft();
      }
    } finally {
      setSending(false);
    }
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
          : presetClass ?? "bg-slate-50/70"
      }`}
    >
      <ChatHeader
        name={name}
        subtitle={subtitle}
        avatarUrl={avatarUrl}
        isSelfNotes={isSelfNotes}
        isTyping={isTyping}
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
            <div className="sticky top-1 z-10 flex justify-center">
              <span
                className={`rounded-full px-3 py-0.5 text-[11px] font-medium shadow-xs backdrop-blur-xs ${
                  vanishMode
                    ? "bg-slate-800/90 text-slate-300"
                    : "bg-white/90 text-slate-500"
                }`}
              >
                Hari Ini
              </span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-xl">
                👋
              </div>
              <p
                className={`text-sm font-semibold ${
                  vanishMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Belum ada pesan
              </p>
              <p
                className={`mt-1 text-xs ${
                  vanishMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Kirim pesan, stiker, atau foto untuk memulai obrolan!
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
                onReply={(m) =>
                  setReplyTarget({ id: m.id, body: m.body })
                }
                onPin={(m) =>
                  setPinnedMessage((prev) => (prev?.id === m.id ? null : m))
                }
              />
            ))
          )}
        </div>
      )}

      <div className="p-3">
        {replyTarget && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-pink-200 bg-white/95 px-3 py-1.5 text-xs shadow-xs">
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
          <div className="mb-2 inline-flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xs">
            <Image
              src={imagePreview}
              alt="Preview"
              width={72}
              height={72}
              unoptimized
              className="h-16 w-16 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`relative flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-md ${
            vanishMode
              ? "border-slate-700 bg-slate-900/90 text-slate-100"
              : "border-slate-200 bg-white/90 text-slate-900"
          }`}
        >
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
            className="rounded-full p-2 text-base transition hover:bg-pink-50"
          >
            📷
          </button>

          <button
            type="button"
            onClick={() => setShowStickers((prev) => !prev)}
            title="Pilih Stiker"
            className="rounded-full p-2 text-base transition hover:bg-pink-50"
          >
            😊
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
            onChange={(e) => {
              setText(e.target.value);
              setIsTyping(e.target.value.trim().length > 0);
            }}
            placeholder={
              vanishMode
                ? "Ketik pesan Vanish Mode..."
                : "Tulis pesan..."
            }
            className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !imagePreview)}
            className="rounded-full bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "Kirim"}
          </button>
        </form>
      </div>
    </div>
  );
}
