"use client";

import { useState } from "react";
import Image from "next/image";
import type { ConversationDto } from "@/lib/types";

interface VibeNotesBarProps {
  conversations: ConversationDto[];
  onReplyNote: (conversationId: string, noteText: string) => void;
}

const DEFAULT_NOTES = [
  "lg nugas zz",
  "online",
  "mabar gas",
  "gabut...",
];

export function VibeNotesBar({
  conversations,
  onReplyNote,
}: VibeNotesBarProps) {
  const [myNote, setMyNote] = useState("Lagi santai ✨");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(myNote);

  const handleSaveNote = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      setMyNote(trimmed);
    }
    setEditing(false);
  };

  return (
    <div className="border-b border-slate-100 px-3 py-2.5">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => {
              setDraft(myNote);
              setEditing(true);
            }}
            className="group relative flex flex-col items-center"
          >
            <span className="mb-1 max-w-20 truncate rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700 shadow-xs">
              {myNote}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-pink-300 bg-white text-sm font-bold text-pink-600 transition group-hover:border-pink-500">
              +
            </div>
            <span className="mt-1 max-w-14 truncate text-[11px] font-medium text-slate-600">
              Catatanmu
            </span>
          </button>
        </div>

        {conversations.slice(0, 8).map((chat, index) => {
          const name = chat.nickname || chat.other?.displayName || "User";
          const noteText = DEFAULT_NOTES[index % DEFAULT_NOTES.length];
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onReplyNote(chat.id, noteText)}
              className="group flex shrink-0 flex-col items-center"
            >
              <span className="mb-1 max-w-20 truncate rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 shadow-xs transition group-hover:border-pink-200 group-hover:bg-pink-50">
                {noteText}
              </span>
              {chat.other?.avatarUrl ? (
                <Image
                  src={chat.other.avatarUrl}
                  alt={name}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 rounded-full border-2 border-pink-200 object-cover transition group-hover:border-pink-500"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-pink-200 bg-pink-100 text-sm font-bold text-pink-600 transition group-hover:border-pink-500">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="mt-1 max-w-14 truncate text-[11px] text-slate-600">
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {editing && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50/60 p-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={40}
            placeholder="Tulis vibe note..."
            className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            className="rounded-lg bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-pink-700"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200/60"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
