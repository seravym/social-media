"use client";

import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";
import {
  PostShareCard,
  type SharedPostData,
} from "@/components/conversations/PostShareCard";

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "👍"];

export interface ReplyTarget {
  id: string;
  body: string;
}

interface MessageBubbleProps {
  message: ChatMessageDto;
  isMine: boolean;
  reaction?: string;
  replyTo?: ReplyTarget;
  isPinned?: boolean;
  vanishMode?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessageDto) => void;
  onPin: (message: ChatMessageDto) => void;
}

function parseSticker(body: string) {
  const match = body.match(/^\[sticker:(.+?):(.+?)\]$/);
  if (!match) return null;
  return { emoji: match[1], label: match[2] };
}

function parsePostShare(body: string): SharedPostData | null {
  if (!body.startsWith("[post-share:") || !body.endsWith("]")) return null;
  try {
    const raw = body.slice("[post-share:".length, -1);
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.title) {
      return parsed as SharedPostData;
    }
    return null;
  } catch {
    return null;
  }
}

export function MessageBubble({
  message,
  isMine,
  reaction,
  replyTo,
  isPinned = false,
  vanishMode = false,
  onReact,
  onReply,
  onPin,
}: MessageBubbleProps) {
  const sticker = parseSticker(message.body);
  const sharedPost = parsePostShare(message.body);
  const timeText = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group flex flex-col ${isMine ? "items-end" : "items-start"}`}
    >
      <div
        className={`flex max-w-[80%] items-end gap-1.5 sm:max-w-[70%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`relative rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
            sticker
              ? "bg-transparent px-1 py-1 shadow-none"
              : isMine
                ? "bg-pink-600 text-white"
                : vanishMode
                  ? "border border-slate-700 bg-slate-800 text-slate-100"
                  : "border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {replyTo && (
            <div
              className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs ${
                isMine
                  ? "border-pink-200 bg-pink-700/60 text-pink-100"
                  : vanishMode
                    ? "border-pink-500 bg-slate-700/70 text-slate-300"
                    : "border-pink-400 bg-slate-100 text-slate-600"
              }`}
            >
              <p className="line-clamp-1">
                {replyTo.body || "Pesan gambar"}
              </p>
            </div>
          )}

          {message.imageUrl && (
            <div className="mb-1.5 overflow-hidden rounded-xl">
              <Image
                src={message.imageUrl}
                alt="Gambar obrolan"
                width={320}
                height={240}
                unoptimized
                className="max-h-60 w-auto rounded-xl object-cover"
              />
            </div>
          )}

          {sticker ? (
            <div className="flex flex-col items-center rounded-2xl bg-white/80 px-3 py-2 shadow-xs backdrop-blur-xs">
              <span className="text-4xl">{sticker.emoji}</span>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-600">
                {sticker.label}
              </span>
            </div>
          ) : sharedPost ? (
            <PostShareCard post={sharedPost} vanishMode={vanishMode} />
          ) : (
            message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              sticker
                ? "text-slate-400"
                : isMine
                  ? "text-pink-100"
                  : "text-slate-400"
            }`}
          >
            {isPinned && <span>📌</span>}
            <span>{timeText}</span>
            {isMine && <span>✓✓</span>}
          </div>

          {reaction && (
            <span className="absolute -bottom-2.5 right-2 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-xs shadow-xs">
              {reaction}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 px-1.5 py-0.5 opacity-0 shadow-xs transition group-hover:opacity-100">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className="rounded-full p-1 text-xs transition hover:scale-110 hover:bg-pink-50"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onReply(message)}
            title="Balas pesan"
            className="rounded-full px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => onPin(message)}
            title={isPinned ? "Lepas sematan" : "Sematkan pesan"}
            className="rounded-full px-1.5 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100"
          >
            📌
          </button>
        </div>
      </div>
    </div>
  );
}
