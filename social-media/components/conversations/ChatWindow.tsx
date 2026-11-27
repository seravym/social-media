"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";
import { ChatHeader } from "@/components/conversations/ChatHeader";
import {
  MessageBubble,
  type ReplyTarget,
} from "@/components/conversations/MessageBubble";
import { StickerPicker } from "@/components/conversations/StickerPicker";
import { MessageAreaSkeleton } from "@/components/conversations/ChatSkeletons";

const CHAT_THEMES: Record<
  string,
  { bg: string; bubble: string; vanishBubble: string; button: string }
> = {
  default: {
    bg: "bg-transparent",
    bubble: "bg-slate-900 text-white",
    vanishBubble: "bg-slate-700 text-white",
    button: "bg-slate-900 hover:bg-slate-800",
  },
  rose: {
    bg: "bg-[#faf0f3]/45",
    bubble: "bg-[#b85c7a] text-white",
    vanishBubble: "bg-[#b85c7a] text-white",
    button: "bg-[#b85c7a] hover:bg-[#9e4865]",
  },
  ocean: {
    bg: "bg-[#f0f4f8]/45",
    bubble: "bg-[#5f84a6] text-white",
    vanishBubble: "bg-[#5f84a6] text-white",
    button: "bg-[#5f84a6] hover:bg-[#4d6e8d]",
  },
  lavender: {
    bg: "bg-[#f6f1f9]/45",
    bubble: "bg-[#8f6fa8] text-white",
    vanishBubble: "bg-[#8f6fa8] text-white",
    button: "bg-[#8f6fa8] hover:bg-[#7a5a93]",
  },
  mint: {
    bg: "bg-[#f0f6f2]/45",
    bubble: "bg-[#6f9a83] text-white",
    vanishBubble: "bg-[#6f9a83] text-white",
    button: "bg-[#6f9a83] hover:bg-[#5c8470]",
  },
};

function startOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  ).getTime();
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.round(
    (startOfDay(today) - startOfDay(date)) / 86_400_000,
  );

  if (diffDays === 0) return "Hari Ini";
  if (diffDays === 1) return "Kemarin";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== today.getFullYear()
      ? { year: "numeric" as const }
      : {}),
  });
}

function isSameDay(a: string, b: string) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

interface ChatWindowProps {
  name: string;
  subtitle: string;
  avatarUrl: string | null;
  currentUserId: string;
  isSelfNotes: boolean;
  loading: boolean;
  loadingMore: boolean;
  messages: ChatMessageDto[];
  hasMore: boolean;
  error: string | null;
  sendError: string | null;
  background: string | null;
  vanishMode: boolean;
  initialDraft?: string;
  onClearInitialDraft?: () => void;
  onBack: () => void;
  onSendMessage: (body: string, imageUrl: string | null) => Promise<void>;
  onLoadMore: () => void;
  onRetryLoad: () => void;
  onRetrySend: () => void;
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
  loadingMore,
  messages,
  hasMore,
  error,
  sendError,
  background,
  vanishMode,
  initialDraft = "",
  onClearInitialDraft,
  onBack,
  onSendMessage,
  onLoadMore,
  onRetryLoad,
  onRetrySend,
  onOpenMedia,
  onOpenSettings,
}: ChatWindowProps) {
  const [text, setText] = useState(initialDraft);
  const [prevInitialDraft, setPrevInitialDraft] = useState(initialDraft);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyMap, setReplyMap] = useState<Record<string, ReplyTarget>>({});
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessageDto | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const pendingScrollRef = useRef(false);
  const pendingPrependRef = useRef(false);
  const prependMetricsRef = useRef({ scrollHeight: 0, scrollTop: 0 });
  const prependStartCountRef = useRef(0);
  const prevCountRef = useRef(0);

  if (initialDraft !== prevInitialDraft) {
    setPrevInitialDraft(initialDraft);
    if (initialDraft) {
      setText(initialDraft);
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const previousCount = prevCountRef.current;
    const isInitial = previousCount === 0 && messages.length > 0;

    if (pendingPrependRef.current) {
      const { scrollHeight, scrollTop } = prependMetricsRef.current;
      el.scrollTop = el.scrollHeight - scrollHeight + scrollTop;
      pendingPrependRef.current = false;
    } else if (
      isInitial ||
      pendingScrollRef.current ||
      (messages.length > previousCount && stickToBottomRef.current)
    ) {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
    }

    pendingScrollRef.current = false;
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (
      !loadingMore &&
      pendingPrependRef.current &&
      messages.length === prependStartCountRef.current
    ) {
      pendingPrependRef.current = false;
    }
  }, [loadingMore, messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const handleLoadMore = () => {
    const el = scrollRef.current;
    if (el) {
      prependMetricsRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      prependStartCountRef.current = messages.length;
      pendingPrependRef.current = true;
    }
    onLoadMore();
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;

    const currentReply = replyTarget;
    const currentImage = imagePreview;

    setText("");
    setImagePreview(null);
    setReplyTarget(null);
    pendingScrollRef.current = true;
    if (onClearInitialDraft) {
      onClearInitialDraft();
    }

    if (currentReply) {
      const tempKey = `${Date.now()}`;
      setReplyMap((prev) => ({ ...prev, [tempKey]: currentReply }));
    }

    void onSendMessage(trimmed, currentImage);
  };

  const handleSendSticker = (stickerText: string) => {
    pendingScrollRef.current = true;
    void onSendMessage(stickerText, null);
  };

  const normalizedBg = background === "pink" ? "rose" : background;
  const theme = (normalizedBg && CHAT_THEMES[normalizedBg]) || CHAT_THEMES.default;
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
      : undefined;

  const activeBubbleClass = vanishMode ? theme.vanishBubble : theme.bubble;

  return (
    <div
      style={containerStyle}
      className={`relative flex flex-1 flex-col overflow-hidden transition-colors ${
        vanishMode ? "bg-slate-950/90 text-slate-100" : theme.bg
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

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p
            className={`text-sm font-medium ${
              vanishMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={onRetryLoad}
            className="rounded-lg bg-[#b85c7a] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#9e4865]"
          >
            Coba lagi
          </button>
        </div>
      ) : loading && messages.length === 0 ? (
        <MessageAreaSkeleton />
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {hasMore && (
            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  vanishMode
                    ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "glass-chip text-[#9e4865] hover:bg-white/85"
                }`}
              >
                {loadingMore ? "Memuat..." : "Muat pesan sebelumnya"}
              </button>
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
            messages.map((msg, index) => {
              const previous = messages[index - 1];
              const showDate =
                !previous || !isSameDay(previous.createdAt, msg.createdAt);

              return (
                <Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium ${
                          vanishMode
                            ? "bg-slate-800/90 text-slate-300"
                            : "glass-chip text-slate-500"
                        }`}
                      >
                        {formatDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isMine={isSelfNotes || msg.senderId === currentUserId}
                    bubbleClass={activeBubbleClass}
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
                </Fragment>
              );
            })
          )}
        </div>
      )}

      <div
        className={`border-t px-4 py-3 ${
          vanishMode
            ? "border-slate-800 bg-slate-900/85 backdrop-blur-md"
            : "border-white/75 bg-white/45 backdrop-blur-md"
        }`}
      >
        {sendError && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#faf0f3] px-3 py-1.5 text-xs text-[#9e4865]">
            <span className="truncate">{sendError}</span>
            <button
              type="button"
              onClick={() => {
                pendingScrollRef.current = true;
                onRetrySend();
              }}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Kirim ulang
            </button>
          </div>
        )}

        {replyTarget && (
          <div className="glass-chip mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-slate-700">Membalas: </span>
              <span className="truncate text-slate-500">
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
          <div className="glass-chip mb-2 inline-flex items-start gap-2 rounded-xl p-2">
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
              className="rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-white/80"
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
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
                ? "border-slate-700 bg-slate-800/90 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                : "border-white/85 bg-white/65 text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-slate-300 focus:bg-white/90"
            }`}
          />

          <button
            type="submit"
            disabled={!text.trim() && !imagePreview}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${theme.button}`}
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
