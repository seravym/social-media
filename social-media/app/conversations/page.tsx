"use client";

import { useEffect, useState } from "react";
import type { ConversationDto } from "@/lib/types";
import { MessageAreaSkeleton } from "@/components/conversations/ChatSkeletons";
import { ChatSidebar } from "@/components/conversations/ChatSidebar";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

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

  const selectedChat = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelectChat = (id: string) => {
    setSelectedId(id);
    setLoadingChat(true);
    setTimeout(() => setLoadingChat(false), 180);
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

  const isSelfNotes = selectedId === "self-notes";
  const activeName = isSelfNotes
    ? "Catatan Pribadi"
    : selectedChat?.nickname || selectedChat?.other?.displayName || "User";
  const activeSubtitle = isSelfNotes
    ? "Ruang catatan pribadi Anda"
    : `@${selectedChat?.other?.username || "user"}`;

  return (
    <div className="min-h-dvh bg-slate-100 p-2 text-slate-900 sm:p-4">
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
          } flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-3xl shadow-sm">
                ✨
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Pilih Percakapan
              </h2>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Pilih chat di sebelah kiri atau buka Catatan Pribadi untuk mulai
                menulis.
              </p>
            </div>
          ) : loadingChat ? (
            <MessageAreaSkeleton />
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-full px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 md:hidden"
                >
                  ← Back
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                  {isSelfNotes ? "📝" : activeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {activeName}
                  </p>
                  <p className="text-xs text-slate-500">{activeSubtitle}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
                <p>Ruang obrolan siap diisi di Commit 4.</p>
                {replyDraft && (
                  <p className="rounded-xl bg-pink-50 px-3 py-1.5 text-xs text-pink-600">
                    Draft note: {replyDraft}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
