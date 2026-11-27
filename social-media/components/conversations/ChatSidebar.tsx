"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ConversationDto, UserCard } from "@/lib/types";
import { ChatListSkeleton } from "@/components/conversations/ChatSkeletons";
import { VibeNotesBar } from "@/components/conversations/VibeNotesBar";

type FilterTab = "all" | "unread" | "pinned";

interface ChatSidebarProps {
  conversations: ConversationDto[];
  selectedId: string | null;
  loading: boolean;
  pinnedIds: string[];
  onSelectChat: (id: string) => void;
  onStartChat: (userId: string) => void;
  onTogglePin: (id: string) => void;
  onReplyNote: (conversationId: string, noteText: string) => void;
}

export function ChatSidebar({
  conversations,
  selectedId,
  loading,
  pinnedIds,
  onSelectChat,
  onStartChat,
  onTogglePin,
  onReplyNote,
}: ChatSidebarProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<UserCard[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/conversations/users?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setFoundUsers(data.items ?? []);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const totalUnread = conversations.reduce(
    (sum, chat) => sum + (chat.unreadCount || 0),
    0
  );

  const filteredConversations = conversations.filter((chat) => {
    if (tab === "unread" && chat.unreadCount === 0) return false;
    if (tab === "pinned" && !pinnedIds.includes(chat.id)) return false;
    return true;
  });

  const handlePickUser = (userId: string) => {
    setSearch("");
    setFoundUsers([]);
    onStartChat(userId);
  };

  return (
    <aside
      className={`${
        selectedId ? "hidden md:flex" : "flex"
      } w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-sm backdrop-blur-md md:w-80 lg:w-96`}
    >
      <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              {totalUnread}
            </span>
          )}
        </div>
        <Link
          href="/home"
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
        >
          Home
        </Link>
      </div>

      <VibeNotesBar conversations={conversations} onReplyNote={onReplyNote} />

      <div className="space-y-2.5 border-b border-slate-200/60 px-3 py-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              if (!value.trim()) {
                setFoundUsers([]);
              }
            }}
            placeholder="Cari user untuk mulai chat..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-pink-400 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFoundUsers([]);
              }}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {search.trim().length > 0 ? (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
            {searching ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                Mencari user...
              </p>
            ) : foundUsers.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                User tidak ditemukan.
              </p>
            ) : (
              foundUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handlePickUser(user.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-pink-50/80"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-600">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {user.displayName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      @{user.username}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-pink-600">
                    Chat
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex gap-1.5">
            {(
              [
                { key: "all", label: "Semua" },
                { key: "unread", label: "Belum Dibaca" },
                { key: "pinned", label: "Disematkan" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  tab === item.key
                    ? "bg-pink-600 text-white"
                    : "bg-white/60 text-slate-600 hover:bg-white/90"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onSelectChat("self-notes")}
          className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
            selectedId === "self-notes"
              ? "border-pink-200/80 bg-pink-50/80"
              : "border-white/80 bg-white/55 hover:bg-white/85"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900">
                Catatan Pribadi
              </p>
              <span className="rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-700">
                Anda
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">
              Simpan catatan, ide, atau foto pribadi
            </p>
          </div>
        </button>

        {loading ? (
          <ChatListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-400">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {tab === "all"
                ? "Belum ada percakapan"
                : tab === "unread"
                  ? "Semua pesan sudah dibaca"
                  : "Belum ada chat disematkan"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Cari user di atas untuk mulai mengobrol.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredConversations.map((chat) => {
              const name = chat.nickname || chat.other?.displayName || "User";
              const isActive = chat.id === selectedId;
              const isPinned = pinnedIds.includes(chat.id);
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectChat(chat.id);
                    }
                  }}
                  className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isActive
                      ? "bg-pink-50/80 text-pink-700"
                      : "hover:bg-white/65"
                  }`}
                >
                  {chat.other?.avatarUrl ? (
                    <Image
                      src={chat.other.avatarUrl}
                      alt={name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-600">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {name}
                      </p>
                      {isPinned && (
                        <svg
                          className="h-3 w-3 shrink-0 text-pink-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                        </svg>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {chat.lastMessage?.body ||
                        (chat.lastMessage?.imageUrl
                          ? "Mengirim gambar"
                          : "Mulai obrolan")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(chat.id);
                      }}
                      title={isPinned ? "Lepas sematan" : "Sematkan chat"}
                      className={`rounded-md p-1 transition group-hover:opacity-100 hover:bg-white/80 ${
                        isPinned
                          ? "text-pink-600 opacity-100"
                          : "text-slate-400 opacity-0 hover:text-slate-700"
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="17" x2="12" y2="22" />
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                      </svg>
                    </button>
                    {chat.unreadCount > 0 && (
                      <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}