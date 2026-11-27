"use client";

import { useEffect, useState } from "react";
import type {
  ChatMessageDto,
  ConversationDetailDto,
  ConversationDto,
} from "@/lib/types";
import { ChatSidebar } from "@/components/conversations/ChatSidebar";
import { ChatWindow } from "@/components/conversations/ChatWindow";
import {
  ChatSettingsDrawer,
  type DrawerMode,
  type SettingsDraft,
} from "@/components/conversations/ChatSettingsDrawer";

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
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [previewSettings, setPreviewSettings] = useState<SettingsDraft | null>(
    null,
  );
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
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      );
      fetch(`/api/conversations/${id}/read`, { method: "POST" });
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setSelectedId(id);
    setDrawerMode(null);
    setPreviewSettings(null);
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleReplyNote = (conversationId: string, noteText: string) => {
    setReplyDraft(`Balas note "${noteText}": `);
    handleSelectChat(conversationId);
  };

  const handleSaveSettings = (updated: SettingsDraft) => {
    if (!selectedId || isSelfNotes) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...updated } : c)),
    );
    setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
    setPreviewSettings(null);
  };

  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setPreviewSettings(null);
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
        : prev,
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
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== tempId),
              }
            : prev,
        );
        return;
      }
      const created = (await res.json()) as ChatMessageDto;
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === tempId ? created : m,
              ),
            }
          : prev,
      );
      loadConversations();
    } catch {
      setDetail((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
          : prev,
      );
    }
  };

  const originalDisplayName =
    detail?.other?.displayName || selectedChat?.other?.displayName || "User";
  const savedNickname = isSelfNotes
    ? null
    : (detail?.nickname ?? selectedChat?.nickname ?? null);
  const savedBackground = isSelfNotes
    ? null
    : (detail?.background ?? selectedChat?.background ?? null);

  const effectiveNickname = previewSettings
    ? previewSettings.nickname
    : savedNickname;
  const effectiveBackground = previewSettings
    ? previewSettings.background
    : savedBackground;

  const activeName = isSelfNotes
    ? "Catatan Pribadi"
    : effectiveNickname || originalDisplayName;
  const activeSubtitle = isSelfNotes
    ? "Tersimpan di perangkat ini"
    : `@${detail?.other?.username || selectedChat?.other?.username || "user"}`;
  const activeAvatar = isSelfNotes
    ? null
    : (detail?.other?.avatarUrl ?? selectedChat?.other?.avatarUrl ?? null);
  const activeMessages = isSelfNotes ? selfMessages : (detail?.messages ?? []);

  const displayConversations = conversations.map((c) =>
    c.id === selectedId && previewSettings
      ? {
          ...c,
          nickname: previewSettings.nickname,
          background: previewSettings.background,
        }
      : c,
  );

  return (
    <div
      className={`min-h-dvh p-2 text-slate-900 transition-colors sm:p-4 ${vanishMode ? "bg-dot-canvas-dark" : "bg-dot-canvas"}`}
    >
      <div className="mx-auto flex h-[calc(100dvh-1rem)] max-w-6xl gap-4 sm:h-[calc(100dvh-2rem)]">
        <ChatSidebar
          conversations={displayConversations}
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
          } glass-panel relative flex-1 overflow-hidden rounded-2xl`}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
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
            <div className="relative flex min-w-0 flex-1 overflow-hidden">
              <ChatWindow
                key={`window-${selectedId}`}
                name={activeName}
                subtitle={activeSubtitle}
                avatarUrl={activeAvatar}
                currentUserId={currentUserId}
                isSelfNotes={isSelfNotes}
                loading={loadingChat}
                messages={activeMessages}
                background={effectiveBackground}
                vanishMode={vanishMode}
                initialDraft={replyDraft}
                onClearInitialDraft={() => setReplyDraft("")}
                onBack={() => {
                  setSelectedId(null);
                  setDrawerMode(null);
                  setPreviewSettings(null);
                }}
                onSendMessage={handleSendMessage}
                onOpenMedia={() =>
                  setDrawerMode((prev) => (prev === "media" ? null : "media"))
                }
                onOpenSettings={() =>
                  setDrawerMode((prev) =>
                    prev === "settings" ? null : "settings",
                  )
                }
              />

              {drawerMode && (
                <ChatSettingsDrawer
                  key={`drawer-${selectedId}`}
                  mode={drawerMode}
                  isSelfNotes={isSelfNotes}
                  conversationId={isSelfNotes ? null : selectedId}
                  displayName={originalDisplayName}
                  nickname={savedNickname}
                  background={savedBackground}
                  messages={activeMessages}
                  vanishMode={vanishMode}
                  onChangeMode={setDrawerMode}
                  onToggleVanish={setVanishMode}
                  onPreviewChange={setPreviewSettings}
                  onSaveSettings={handleSaveSettings}
                  onClose={handleCloseDrawer}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
