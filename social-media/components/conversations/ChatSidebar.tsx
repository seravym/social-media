"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  onCreateGroup: (name: string, memberIds: string[]) => Promise<boolean>;
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
  onCreateGroup,
  onTogglePin,
  onReplyNote,
}: ChatSidebarProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<UserCard[]>([]);
  const [searching, setSearching] = useState(false);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupResults, setGroupResults] = useState<UserCard[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserCard[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

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
          { cache: "no-store" },
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

  useEffect(() => {
    if (!groupModalOpen) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/conversations/users?q=${encodeURIComponent(groupSearch.trim())}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (active) setGroupResults(data.items ?? []);
      } catch {
        return;
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [groupModalOpen, groupSearch]);

  const totalUnread = conversations.reduce(
    (sum, chat) => sum + (chat.unreadCount || 0),
    0,
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

  const toggleMember = (user: UserCard) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    );
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed || selectedMembers.length === 0) return;
    setCreatingGroup(true);
    setGroupError(null);
    const ok = await onCreateGroup(
      trimmed,
      selectedMembers.map((m) => m.id),
    );
    setCreatingGroup(false);
    if (ok) {
      setGroupModalOpen(false);
      setGroupName("");
      setGroupSearch("");
      setSelectedMembers([]);
    } else {
      setGroupError("Gagal membuat grup.");
    }
  };

  return (
    <aside
      className={`${
        selectedId ? "hidden md:flex" : "flex"
      } glass-panel w-full flex-col overflow-hidden rounded-2xl md:w-80 lg:w-96`}
    >
      <div className="flex items-center justify-between border-b border-white/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-900">Pesan</h1>
          {totalUnread > 0 && (
            <span className="rounded-full bg-[#b85c7a] px-2 py-0.5 text-[11px] font-semibold text-white">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setGroupError(null);
            setGroupModalOpen(true);
          }}
          className="glass-chip inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#9e4865] transition hover:bg-white/90 hover:text-[#7f364e] active:scale-[0.98]"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <span>Grup</span>
        </button>
      </div>

      <VibeNotesBar conversations={conversations} onReplyNote={onReplyNote} />

      <div className="border-b border-white/70 px-3 pt-3">
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
            className="w-full rounded-xl border border-white/85 bg-white/60 px-3.5 py-2 text-xs text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#b85c7a]/60 focus:bg-white/90"
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
          <div className="my-2.5 max-h-48 overflow-y-auto rounded-xl border border-white/85 bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
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
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#faf0f3]"
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf0f3] text-xs font-semibold text-[#b85c7a]">
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
                  <span className="text-[11px] font-semibold text-[#b85c7a]">
                    Obrolan
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="mt-2 flex gap-4 px-1">
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
                className={`border-b-2 pb-2 text-xs font-medium transition ${
                  tab === item.key
                    ? "border-[#b85c7a] font-semibold text-[#b85c7a]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
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
          className={`mb-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
            selectedId === "self-notes"
              ? "bg-white/80 shadow-xs"
              : "hover:bg-white/50"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faf0f3] text-[#b85c7a] ring-1 ring-[#b85c7a]/20">
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
            <p className="truncate text-sm font-semibold text-slate-900">
              Catatan Pribadi
            </p>
            <p className="truncate text-xs text-slate-500">Draf Anda</p>
          </div>
        </button>

        {loading ? (
          <ChatListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="glass-chip mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400">
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
                  : "Belum ada obrolan disematkan"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Cari user di atas untuk mulai mengobrol.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredConversations.map((chat) => {
              const isGroup = chat.type === "group";
              const name = isGroup
                ? chat.name || "Grup"
                : chat.nickname || chat.other?.displayName || "User";
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
                      ? "bg-white/80 shadow-xs"
                      : "hover:bg-white/50"
                  }`}
                >
                  {!isGroup && chat.other?.avatarUrl ? (
                    <Image
                      src={chat.other.avatarUrl}
                      alt={name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faf0f3] text-sm font-semibold text-[#b85c7a]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {name}
                      </p>
                      {isGroup && (
                        <span className="text-[11px] font-medium text-slate-400">
                          · Grup
                        </span>
                      )}
                      {isPinned && (
                        <svg
                          className="h-3 w-3 shrink-0 text-[#b85c7a]"
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
                      {chat.lastMessage?.deletedAt
                        ? "Pesan telah dihapus"
                        : chat.lastMessage?.body ||
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
                      title={isPinned ? "Lepas sematan" : "Sematkan obrolan"}
                      className={`rounded-md p-1 transition group-hover:opacity-100 hover:bg-white/80 ${
                        isPinned
                          ? "text-[#b85c7a] opacity-100"
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
                      <span className="rounded-full bg-[#b85c7a] px-2 py-0.5 text-[11px] font-semibold text-white">
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

      {groupModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          onClick={() => !creatingGroup && setGroupModalOpen(false)}
        >
          <form
            onSubmit={handleSubmitGroup}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-sm overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/70 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Buat Grup Baru
              </h3>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                disabled={creatingGroup}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/70 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-4">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nama grup..."
                maxLength={60}
                className="w-full rounded-xl border border-white/85 bg-white/75 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#b85c7a]/60"
              />

              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full rounded-xl border border-white/85 bg-white/60 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#b85c7a]/60"
              />

              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m)}
                      className="rounded-lg bg-[#faf0f3] px-2.5 py-1 text-[11px] font-medium text-[#9e4865]"
                    >
                      {m.displayName} ✕
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/75 bg-white/60 p-1.5">
                {groupResults.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-slate-400">
                    User tidak ditemukan.
                  </p>
                ) : (
                  groupResults.map((user) => {
                    const picked = selectedMembers.some(
                      (m) => m.id === user.id,
                    );
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleMember(user)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          picked
                            ? "bg-[#faf0f3] text-[#9e4865]"
                            : "hover:bg-white/80"
                        }`}
                      >
                        <span className="truncate font-medium">
                          {user.displayName}{" "}
                          <span className="text-slate-400">
                            @{user.username}
                          </span>
                        </span>
                        <span className="text-[11px] font-semibold">
                          {picked ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {groupError && (
                <p className="text-xs text-rose-600">{groupError}</p>
              )}

              <button
                type="submit"
                disabled={
                  creatingGroup ||
                  !groupName.trim() ||
                  selectedMembers.length === 0
                }
                className="w-full rounded-xl bg-[#b85c7a] py-2 text-xs font-semibold text-white transition hover:bg-[#9e4865] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingGroup ? "Membuat..." : "Buat Grup"}
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}