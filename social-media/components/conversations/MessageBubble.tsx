"use client";

import { useState } from "react";
import Image from "next/image";
import type { ChatMessageDto, ChatReactionDto } from "@/lib/types";
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
  senderName?: string;
  bubbleClass?: string;
  reactions?: ChatReactionDto[];
  replyTo?: ReplyTarget;
  isPinned?: boolean;
  vanishMode?: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessageDto) => void;
  onPin: (message: ChatMessageDto) => void;
  onEditMessage: (messageId: string, body: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onForward: (message: ChatMessageDto) => void;
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
  senderName,
  bubbleClass = "bg-slate-900 text-white",
  reactions = [],
  replyTo,
  isPinned = false,
  vanishMode = false,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onReact,
  onReply,
  onPin,
  onEditMessage,
  onDeleteMessage,
  onForward,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const sticker = parseSticker(message.body);
  const sharedPost = parsePostShare(message.body);
  const isDeleted = Boolean(message.deletedAt);
  const canManage = isMine && !isDeleted;
  const timeText = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startEdit = () => {
    setDraft(message.body);
    setEditError(null);
    onCloseMenu();
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError(null);
  };

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    setEditError(null);
    const ok = await onEditMessage(message.id, trimmed);
    setSaving(false);
    if (ok) {
      setEditing(false);
    } else {
      setEditError("Gagal menyimpan perubahan.");
    }
  };

  const handleDelete = async () => {
    onCloseMenu();
    if (!window.confirm("Hapus pesan ini?")) return;
    const ok = await onDeleteMessage(message.id);
    if (!ok) {
      window.alert("Gagal menghapus pesan.");
    }
  };

  return (
    <div
      className={`group flex flex-col ${isMine ? "items-end" : "items-start"}`}
    >
      {!isMine && senderName && (
        <span
          className={`mb-0.5 ml-1 text-[11px] font-medium ${
            vanishMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {senderName}
        </span>
      )}

      <div
        className={`flex max-w-[80%] items-end gap-1.5 sm:max-w-[70%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`relative px-3.5 py-2 text-sm transition-colors ${
            sticker && !isDeleted
              ? "bg-transparent px-1 py-1"
              : isMine
                ? `rounded-2xl rounded-br-sm ${bubbleClass}`
                : vanishMode
                  ? "rounded-2xl rounded-bl-sm border border-slate-700 bg-slate-800 text-slate-100"
                  : "rounded-2xl rounded-bl-sm border border-white/80 bg-white/80 text-slate-800 backdrop-blur-xs"
          }`}
        >
          {editing ? (
            <div className="min-w-44">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                autoFocus
                className="w-full resize-none rounded-lg border border-white/70 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-300"
              />
              {editError && (
                <p className="mt-1 text-[10px] font-medium text-rose-200">
                  {editError}
                </p>
              )}
              <div className="mt-1.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-black/10 hover:text-white disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving || !draft.trim()}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#9e4865] transition hover:bg-[#faf0f3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : isDeleted ? (
            <p
              className={`italic ${
                isMine ? "text-white/80" : "text-slate-500"
              }`}
            >
              Pesan telah dihapus
            </p>
          ) : (
            <>
              {message.isForwarded && (
                <p
                  className={`mb-1 text-[10px] font-medium ${
                    isMine ? "text-white/75" : "text-slate-400"
                  }`}
                >
                  Diteruskan
                </p>
              )}

              {replyTo && (
                <div
                  className={`mb-1.5 rounded-md border-l-2 px-2 py-1 text-xs ${
                    isMine
                      ? "border-white/50 bg-black/15 text-white/90"
                      : vanishMode
                        ? "border-slate-500 bg-slate-700/70 text-slate-300"
                        : "border-slate-400 bg-slate-100 text-slate-600"
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
            </>
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              sticker && !isDeleted
                ? "text-slate-400"
                : isMine
                  ? "text-white/75"
                  : "text-slate-400"
            }`}
          >
            {isPinned && !isDeleted && <span>Disematkan ·</span>}
            {message.editedAt && !isDeleted && <span>diedit ·</span>}
            <span>{timeText}</span>
          </div>

          {reactions.length > 0 && !isDeleted && (
            <span className="absolute -bottom-2.5 right-2 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-xs shadow-2xs">
              {reactions.map((item) => (
                <span key={item.emoji} className={item.mine ? "font-semibold" : undefined}>
                  {item.emoji}
                  {item.count > 1 ? ` ${item.count}` : ""}
                </span>
              ))}
            </span>
          )}
        </div>

        {!isDeleted && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 transition ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
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
                isPinned ? "text-[#b85c7a]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleMenu}
              title="Menu pesan"
              className="rounded-md px-1.5 py-1 text-sm leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 z-30 mt-1 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
                {canManage && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="block w-full px-3 py-1.5 text-left text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="block w-full px-3 py-1.5 text-left text-rose-600 transition hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onCloseMenu();
                    onForward(message);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  Teruskan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}