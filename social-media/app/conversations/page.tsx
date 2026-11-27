"use client";

import { useEffect, useState } from "react";
import type {
  ChatMessageDto,
  ConversationDetailDto,
  ConversationDto,
} from "@/lib/types";
import { ChatSidebar } from "@/components/conversations/ChatSidebar";
import { ChatWindow } from "@/components/conversations/ChatWindow";

const SELF_NOTES_KEY = "social_media_self_notes_v1";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailDto | null>(null);
  const [selfMessages, setSelfMessages] = useState<ChatMessageDto[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(SELF_NOTES_KEY);
      return saved ? (JSON.parse(saved) as ChatMessageDto[]) : [];
    } catch {
      return [];
    }
  });
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [vanishMode, setVanishMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const selectedChat = conversations.find((c) => c.id === selectedId) ?? null;
  const isSelfNotes = selectedId === "self-notes";
  const currentUserId =
    detail?.members.find((m) => m.user.id !== detail.other?.id)?.user.id ?? "";

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.items ?? []);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadDetail = async (id: string) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as ConversationDetailDto;
      setDetail(data);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
      fetch(`/api/conversations/${id}/read`, { method: "POST" });
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setSelectedId(id);
    setShowSettings(false);
    setShowMedia(false);
    if (id === "self-notes") {
      setDetail(null);
      setLoadingChat(false);
      return;
    }
    loadDetail(id);
  };

  const handleStartChat = async (userId: string) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    await loadConversations();
    if (data.conversationId) {
      handleSelectChat(data.conversationId);
    }
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleReplyNote = (conversationId: string, noteText: string) => {
    setReplyDraft(`Balas note "${noteText}": `);
    handleSelectChat(conversationId);
  };

  const handleSendMessage = async (body: string, imageUrl: string | null) => {
    if (!selectedId) return;

    if (selectedId === "self-notes") {
      const newNote: ChatMessageDto = {
        id: `note_${Date.now()}`,
        senderId: "self",
        body,
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      setSelfMessages((prev) => {
        const next = [...prev, newNote];
        try {
          localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessageDto = {
      id: tempId,
      senderId: currentUserId,
      body,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    setDetail((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, optimisticMessage] }
        : prev
    );

    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, imageUrl }),
      });
      if (!res.ok) {
        setDetail((prev) =>
          prev
            ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
            : prev
        );
        return;
      }
      const created = (await res.json()) as ChatMessageDto;
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) => (m.id === tempId ? created : m)),
            }
          : prev
      );
      loadConversations();
    } catch {
      setDetail((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
          : prev
      );
    }
  };

  const activeName = isSelfNotes
    ? "Catatan Pribadi"
    : detail?.nickname ||
      selectedChat?.nickname ||
      detail?.other?.displayName ||
      selectedChat?.other?.displayName ||
      "User";
  const activeSubtitle = isSelfNotes
    ? "Tersimpan di perangkat ini"
    : `@${detail?.other?.username || selectedChat?.other?.username || "user"}`;
  const activeAvatar = isSelfNotes
    ? null
    : detail?.other?.avatarUrl ?? selectedChat?.other?.avatarUrl ?? null;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-rose-100/70 via-slate-100 to-pink-100/70 p-2 text-slate-900 sm:p-4">
      <div className="mx-auto flex h-[calc(100dvh-1rem)] max-w-6xl gap-4 sm:h-[calc(100dvh-2rem)]">
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedId}
          loading={loadingList}
          pinnedIds={pinnedIds}
          onSelectChat={handleSelectChat}
          onStartChat={handleStartChat}
          onTogglePin={handleTogglePin}
          onReplyNote={handleReplyNote}
        />

        <main
          className={`${
            selectedId ? "flex" : "hidden md:flex"
          } relative flex-1 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-sm backdrop-blur-md`}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-400 shadow-xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">
                Belum ada obrolan dipilih
              </h2>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Pilih percakapan di sebelah kiri untuk mulai berkirim pesan.
              </p>
            </div>
          ) : (
            <ChatWindow
              key={selectedId}
              name={activeName}
              subtitle={activeSubtitle}
              avatarUrl={activeAvatar}
              currentUserId={currentUserId}
              isSelfNotes={isSelfNotes}
              loading={loadingChat}
              messages={isSelfNotes ? selfMessages : detail?.messages ?? []}
              background={
                isSelfNotes
                  ? null
                  : detail?.background ?? selectedChat?.background ?? null
              }
              vanishMode={vanishMode}
              initialDraft={replyDraft}
              onClearInitialDraft={() => setReplyDraft("")}
              onBack={() => setSelectedId(null)}
              onSendMessage={handleSendMessage}
              onOpenMedia={() => setShowMedia((prev) => !prev)}
              onOpenSettings={() => setShowSettings((prev) => !prev)}
            />
          )}

          {(showSettings || showMedia) && (
            <div className="border-t border-slate-200/60 bg-white/80 px-4 py-2 text-xs text-slate-500 backdrop-blur-md">
              {showSettings
                ? "Pengaturan obrolan sedang disiapkan."
                : "Galeri media sedang disiapkan."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}