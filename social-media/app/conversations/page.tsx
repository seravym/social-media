"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChatMessageDto,
  ConversationDetailDto,
  ConversationDto,
  ConversationListResponse,
  ConversationMessagesResponse,
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<{
    body: string;
    imageUrl: string | null;
    replyToId: string | null;
  } | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const selectedChat = conversations.find((c) => c.id === selectedId) ?? null;
  const isSelfNotes = selectedId === "self-notes";

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ConversationListResponse;
      setConversations(data.items ?? []);
      setCurrentUserId(data.currentUserId ?? "");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;

      try {
        const listRes = await fetch("/api/conversations", { cache: "no-store" });
        if (listRes.ok) {
          const listData = (await listRes.json()) as ConversationListResponse;
          setConversations(listData.items ?? []);
          setCurrentUserId(listData.currentUserId ?? "");
        }
      } catch {
        return;
      }

      const id = selectedIdRef.current;
      if (!id || id === "self-notes") return;

      const url = `/api/conversations/${id}/messages?limit=30`;

      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ConversationMessagesResponse;
        if (selectedIdRef.current !== id) return;
        setChatError(null);
        const incoming = data.messages ?? [];
        if (incoming.length === 0) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        );
        void fetch(`/api/conversations/${id}/read`, { method: "POST" });
        setMessages((prev) => {
          const incomingById = new Map(incoming.map((m) => [m.id, m]));
          const merged = prev.map((m) => incomingById.get(m.id) ?? m);
          const seen = new Set(merged.map((m) => m.id));
          const fresh = incoming.filter((m) => !seen.has(m.id));
          if (fresh.length === 0 && merged.every((m, i) => m === prev[i])) {
            return prev;
          }
          return [...merged, ...fresh].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          );
        });
      } catch {
        return;
      }
    };

    const interval = window.setInterval(poll, 4000);
    const handleVisibility = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const loadDetail = async (id: string) => {
    setLoadingChat(true);
    setChatError(null);
    setSendError(null);
    setMessages([]);
    setHasMore(false);
    try {
      const [detailRes, messagesRes] = await Promise.all([
        fetch(`/api/conversations/${id}`, { cache: "no-store" }),
        fetch(`/api/conversations/${id}/messages?limit=30`, {
          cache: "no-store",
        }),
      ]);
      if (selectedIdRef.current !== id) return;
      if (!detailRes.ok || !messagesRes.ok) {
        setChatError("Gagal memuat percakapan.");
        return;
      }
      const detailData = (await detailRes.json()) as ConversationDetailDto;
      const messagesData =
        (await messagesRes.json()) as ConversationMessagesResponse;
      if (selectedIdRef.current !== id) return;
      setDetail(detailData);
      setCurrentUserId(
        detailData.currentUserId ?? messagesData.currentUserId ?? "",
      );
      setMessages(messagesData.messages ?? []);
      setHasMore(Boolean(messagesData.hasMore));
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      );
      fetch(`/api/conversations/${id}/read`, { method: "POST" });
    } catch {
      if (selectedIdRef.current === id) {
        setChatError("Gagal memuat percakapan. Periksa koneksi Anda.");
      }
    } finally {
      if (selectedIdRef.current === id) {
        setLoadingChat(false);
      }
    }
  };

  const handleSelectChat = (id: string) => {
    selectedIdRef.current = id;
    setSelectedId(id);
    setDrawerMode(null);
    setPreviewSettings(null);
    setChatError(null);
    setSendError(null);
    setMessages([]);
    setHasMore(false);
    if (id === "self-notes") {
      setDetail(null);
      setLoadingChat(false);
      return;
    }
    setDetail(null);
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

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "group", name, memberIds }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      await loadConversations();
      if (data.conversationId) {
        handleSelectChat(data.conversationId);
      }
      return true;
    } catch {
      return false;
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

  const handleSendMessage = async (
    body: string,
    imageUrl: string | null,
    replyToId: string | null = null,
  ) => {
    if (!selectedId) return;

    if (selectedId === "self-notes") {
      const newNote: ChatMessageDto = {
        id: `note_${Date.now()}`,
        senderId: "self",
        body,
        imageUrl,
        isForwarded: false,
        editedAt: null,
        deletedAt: null,
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

    setSendError(null);
    const conversationId = selectedId;
    const tempId = `temp_${Date.now()}`;
    const replySource = replyToId
      ? messages.find((m) => m.id === replyToId) ?? null
      : null;
    const optimisticMessage: ChatMessageDto = {
      id: tempId,
      senderId: currentUserId,
      body,
      imageUrl,
      isForwarded: false,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      replyTo: replySource
        ? {
            id: replySource.id,
            senderId: replySource.senderId,
            body: replySource.deletedAt ? "" : replySource.body,
          }
        : null,
      reactions: [],
      pinnedAt: null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, imageUrl, replyToId }),
      });
      if (selectedIdRef.current !== conversationId) return;
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSendError({ body, imageUrl, replyToId });
        return;
      }
      const created = (await res.json()) as ChatMessageDto;
      setMessages((prev) => {
        const seen = new Set<string>();
        return prev
          .map((m) => (m.id === tempId ? created : m))
          .filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
      });
      loadConversations();
    } catch {
      if (selectedIdRef.current !== conversationId) return;
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError({ body, imageUrl, replyToId });
    }
  };

  const handleRetrySend = () => {
    if (!sendError) return;
    const payload = sendError;
    setSendError(null);
    void handleSendMessage(payload.body, payload.imageUrl, payload.replyToId);
  };

  const handleRetryLoad = () => {
    if (!selectedId || selectedId === "self-notes") return;
    void loadDetail(selectedId);
  };

  const handleLoadMore = async () => {
    if (!selectedId || selectedId === "self-notes" || loadingMore || !hasMore) {
      return;
    }
    const oldest = messages[0];
    if (!oldest) return;

    const conversationId = selectedId;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?cursor=${encodeURIComponent(
          oldest.id,
        )}&limit=30`,
        { cache: "no-store" },
      );
      if (selectedIdRef.current !== conversationId) return;
      if (!res.ok) return;
      const data = (await res.json()) as ConversationMessagesResponse;
      const incoming = data.messages ?? [];
      if (incoming.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const older = incoming.filter((m) => !seen.has(m.id));
        return older.length > 0 ? [...older, ...prev] : prev;
      });
      setHasMore(Boolean(data.hasMore));
    } catch {
      return;
    } finally {
      setLoadingMore(false);
    }
  };

  const handleEditMessage = async (messageId: string, body: string) => {
    if (isSelfNotes) {
      setSelfMessages((prev) => {
        const next = prev.map((m) =>
          m.id === messageId
            ? { ...m, body, editedAt: new Date().toISOString() }
            : m,
        );
        try {
          localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
      return true;
    }

    if (!selectedId) return false;

    try {
      const res = await fetch(
        `/api/conversations/${selectedId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!res.ok) return false;
      const updated = (await res.json()) as ChatMessageDto;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m)),
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (isSelfNotes) {
      setSelfMessages((prev) => {
        const next = prev.map((m) =>
          m.id === messageId
            ? { ...m, deletedAt: new Date().toISOString() }
            : m,
        );
        try {
          localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
      return true;
    }

    if (!selectedId) return false;

    try {
      const res = await fetch(
        `/api/conversations/${selectedId}/messages/${messageId}`,
        { method: "DELETE" },
      );
      if (!res.ok) return false;
      const updated = (await res.json()) as ChatMessageDto;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m)),
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (isSelfNotes) {
      setSelfMessages((prev) => {
        const next = prev.map((m) => {
          if (m.id !== messageId) return m;
          const current = m.reactions ?? [];
          const existing = current.find((r) => r.mine);
          if (existing && existing.emoji === emoji) {
            return {
              ...m,
              reactions: current
                .map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count - 1, mine: false }
                    : r,
                )
                .filter((r) => r.count > 0),
            };
          }
          const withoutMine = current
            .map((r) => (r.mine ? { ...r, count: r.count - 1, mine: false } : r))
            .filter((r) => r.count > 0);
          const target = withoutMine.find((r) => r.emoji === emoji);
          if (target) {
            return {
              ...m,
              reactions: withoutMine.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r,
              ),
            };
          }
          return {
            ...m,
            reactions: [...withoutMine, { emoji, count: 1, mine: true }],
          };
        });
        try {
          localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
      return;
    }

    if (!selectedId) return;
    try {
      const res = await fetch(
        `/api/conversations/${selectedId}/messages/${messageId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        },
      );
      if (!res.ok) return;
      const updated = (await res.json()) as ChatMessageDto;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m)),
      );
    } catch {
      return;
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (isSelfNotes) {
      setSelfMessages((prev) => {
        const target = prev.find((m) => m.id === messageId);
        const shouldPin = !target?.pinnedAt;
        const next = prev.map((m) => ({
          ...m,
          pinnedAt:
            m.id === messageId && shouldPin
              ? new Date().toISOString()
              : null,
        }));
        try {
          localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
      return;
    }

    if (!selectedId) return;
    try {
      const res = await fetch(
        `/api/conversations/${selectedId}/messages/${messageId}/pin`,
        { method: "POST" },
      );
      if (!res.ok) return;
      const updated = (await res.json()) as ChatMessageDto;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) return updated;
          return updated.pinnedAt ? { ...m, pinnedAt: null } : m;
        }),
      );
    } catch {
      return;
    }
  };

  const handleForwardMessage = async (
    conversationId: string,
    message: ChatMessageDto,
  ) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: message.body,
          imageUrl: message.imageUrl,
          isForwarded: true,
        }),
      });
      if (!res.ok) return false;
      const created = (await res.json()) as ChatMessageDto;
      if (conversationId === selectedIdRef.current) {
        setMessages((prev) => [...prev, created]);
      }
      void loadConversations();
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (!res.ok) return false;

      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId),
      );

      if (selectedIdRef.current === conversationId) {
        selectedIdRef.current = null;
        setSelectedId(null);
        setDetail(null);
        setMessages([]);
        setHasMore(false);
        setChatError(null);
        setSendError(null);
      }

      setDrawerMode(null);
      setPreviewSettings(null);
      return true;
    } catch {
      return false;
    }
  };

  const isGroup =
    !isSelfNotes &&
    (detail?.type === "group" || selectedChat?.type === "group");

  const senderMap = Object.fromEntries(
    (detail?.members ?? []).map((m) => [
      m.user.id,
      m.nickname || m.user.displayName,
    ]),
  );

  const originalDisplayName = isGroup
    ? detail?.name || selectedChat?.name || "Grup"
    : detail?.other?.displayName || selectedChat?.other?.displayName || "User";
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
    : isGroup
      ? originalDisplayName
      : effectiveNickname || originalDisplayName;
  const activeSubtitle = isSelfNotes
    ? "Tersimpan di perangkat ini"
    : isGroup
      ? `${detail?.members.length ?? 0} anggota`
      : `@${detail?.other?.username || selectedChat?.other?.username || "user"}`;
  const activeAvatar =
    isSelfNotes || isGroup
      ? null
      : (detail?.other?.avatarUrl ?? selectedChat?.other?.avatarUrl ?? null);
  const activeMessages = isSelfNotes ? selfMessages : messages;

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
      className={`min-h-[calc(100dvh-4rem)] p-2.5 text-slate-900 transition-colors sm:p-4 ${
        vanishMode ? "bg-dot-canvas-dark" : "bg-dot-canvas"
      }`}
    >
      <div className="mx-auto flex h-[calc(100dvh-5.25rem)] max-w-6xl gap-4 sm:h-[calc(100dvh-6rem)]">
        <ChatSidebar
          conversations={displayConversations}
          selectedId={selectedId}
          loading={loadingList}
          pinnedIds={pinnedIds}
          onSelectChat={handleSelectChat}
          onStartChat={handleStartChat}
          onCreateGroup={handleCreateGroup}
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
              <div className="glass-chip mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl text-[#b85c7a]">
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
              <h2 className="text-sm font-semibold text-slate-900">
                Belum ada obrolan dipilih
              </h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Pilih percakapan di sebelah kiri atau buka Catatan Pribadi untuk
                mulai menulis.
              </p>
              <button
                type="button"
                onClick={() => handleSelectChat("self-notes")}
                className="glass-chip mt-4 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[#9e4865] transition hover:bg-white/85"
              >
                Buka Catatan Pribadi
              </button>
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
                isGroup={isGroup}
                senderMap={senderMap}
                loading={loadingChat}
                messages={activeMessages}
                hasMore={isSelfNotes ? false : hasMore}
                loadingMore={loadingMore}
                error={isSelfNotes ? null : chatError}
                sendError={sendError ? "Pesan gagal terkirim." : null}
                conversations={displayConversations}
                background={effectiveBackground}
                vanishMode={vanishMode}
                initialDraft={replyDraft}
                onClearInitialDraft={() => setReplyDraft("")}
                onLoadMore={handleLoadMore}
                onRetryLoad={handleRetryLoad}
                onRetrySend={handleRetrySend}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onPinMessage={handlePinMessage}
                onForwardMessage={handleForwardMessage}
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
                  onDeleteConversation={handleDeleteConversation}
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