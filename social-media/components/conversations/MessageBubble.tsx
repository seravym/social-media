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
  const isSending = message.id.startsWith("temp_");
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
          className={`relative px-3.5 py-2 text-sm transition-opacity ${
            isSending ? "opacity-75" : "opacity-100"
          } ${
            sticker
              ? "bg-transparent px-1 py-1"
              : isMine
                ? "rounded-2xl rounded-br-sm bg-pink-600 text-white"
                : vanishMode
                  ? "rounded-2xl rounded-bl-sm border border-slate-700 bg-slate-800 text-slate-100"
                  : "rounded-2xl rounded-bl-sm border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {replyTo && (
            <div
              className={`mb-1.5 rounded-md border-l-2 px-2 py-1 text-xs ${
                isMine
                  ? "border-pink-200 bg-pink-700/50 text-pink-100"
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
            <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white px-3 py-2">
              <span className="text-4xl">{sticker.emoji}</span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-500">
                {sticker.label}
              </span>
            </div>
          ) : sharedPost ? (
            <PostShareCard post={sharedPost} vanishMode={vanishMode} />
          ) : (
            message.body && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.body}
              </p>
            )
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              sticker
                ? "text-slate-400"
                : isMine
                  ? "text-pink-100/90"
                  : "text-slate-400"
            }`}
          >
            {isPinned && <span>Disematkan ·</span>}
            <span>{isSending ? "Mengirim..." : timeText}</span>
          </div>

          {reaction && (
            <span className="absolute -bottom-2.5 right-2 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-xs shadow-xs">
              {reaction}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className="rounded-md p-1 text-xs transition hover:bg-slate-100"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onReply(message)}
            title="Balas pesan"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onPin(message)}
            title={isPinned ? "Lepas sematan" : "Sematkan pesan"}
            className={`rounded-md p-1 transition hover:bg-slate-100 ${
              isPinned ? "text-pink-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}