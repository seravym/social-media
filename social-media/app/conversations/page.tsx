"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ConversationDto } from "@/lib/types";
import {
  ChatListSkeleton,
  MessageAreaSkeleton,
} from "@/components/conversations/ChatSkeletons";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setConversations(data.items ?? []);
        }
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    }

    loadConversations();
    return () => {
      active = false;
    };
  }, []);

  const selectedChat = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelectChat = (id: string) => {
    setSelectedId(id);
    setLoadingChat(true);
    setTimeout(() => setLoadingChat(false), 200);
  };

  return (
    <div className="min-h-dvh bg-slate-100 p-2 text-slate-900 sm:p-4">
      <div className="mx-auto flex h-[calc(100dvh-1rem)] max-w-6xl gap-4 sm:h-[calc(100dvh-2rem)]">
        <aside
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:w-80 lg:w-96`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Messages</h1>
              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-600">
                {conversations.length}
              </span>
            </div>
            <Link
              href="/home"
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Home
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <ChatListSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl">
                  💬
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Belum ada percakapan
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cari teman untuk mulai ngobrol dan kirim foto.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {conversations.map((chat) => {
                  const name =
                    chat.nickname || chat.other?.displayName || "User";
                  const isActive = chat.id === selectedId;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? "bg-pink-50 text-pink-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {chat.lastMessage?.body ||
                            (chat.lastMessage?.imageUrl
                              ? "Mengirim gambar"
                              : "Mulai obrolan")}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main
          className={`${
            selectedId ? "flex" : "hidden md:flex"
          } flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}
        >
          {!selectedChat ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-3xl shadow-sm">
                ✨
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Pilih Percakapan
              </h2>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Pilih chat di sebelah kiri untuk mulai mengirim pesan, stiker,
                dan foto.
              </p>
            </div>
          ) : loadingChat ? (
            <MessageAreaSkeleton />
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-full px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 md:hidden"
                >
                  ← Back
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                  {(
                    selectedChat.nickname ||
                    selectedChat.other?.displayName ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedChat.nickname ||
                      selectedChat.other?.displayName ||
                      "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{selectedChat.other?.username || "user"}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400">
                Chats.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
