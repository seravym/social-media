"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ChatMessageDto } from "@/lib/types";

export type DrawerMode = "settings" | "media";

export interface SettingsDraft {
  nickname: string | null;
  background: string | null;
}

interface ChatSettingsDrawerProps {
  mode: DrawerMode;
  isSelfNotes: boolean;
  conversationId: string | null;
  displayName: string;
  nickname: string | null;
  background: string | null;
  messages: ChatMessageDto[];
  vanishMode: boolean;
  onChangeMode: (mode: DrawerMode) => void;
  onToggleVanish: (value: boolean) => void;
  onPreviewChange?: (draft: SettingsDraft) => void;
  onSaveSettings: (updated: SettingsDraft) => void;
  onDeleteConversation: (conversationId: string) => Promise<boolean>;
  onClose: () => void;
}

const CHAT_THEMES = [
  { id: "", label: "Monokrom", swatch: "bg-slate-900" },
  { id: "rose", label: "Dusty Rose", swatch: "bg-[#b85c7a]" },
  { id: "ocean", label: "Biru Kelabu", swatch: "bg-[#5f84a6]" },
  { id: "lavender", label: "Mauve", swatch: "bg-[#8f6fa8]" },
  { id: "mint", label: "Sage", swatch: "bg-[#6f9a83]" },
];

function parseBackgroundValue(raw: string | null) {
  if (!raw) return { bubble: "", image: "" };
  if (raw === "pink") return { bubble: "rose", image: "" };
  if (raw.includes("|")) {
    const [bubble, ...rest] = raw.split("|");
    return {
      bubble: bubble === "pink" ? "rose" : bubble,
      image: rest.join("|"),
    };
  }
  const isImg =
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:image/");
  return isImg ? { bubble: "", image: raw } : { bubble: raw, image: "" };
}

function serializeBackgroundValue(bubble: string, image: string) {
  const b = bubble.trim();
  const img = image.trim();
  if (b && img) return `${b}|${img}`;
  return img || b || null;
}

export function ChatSettingsDrawer({
  mode,
  isSelfNotes,
  conversationId,
  displayName,
  nickname,
  background,
  messages,
  vanishMode,
  onChangeMode,
  onToggleVanish,
  onPreviewChange,
  onSaveSettings,
  onDeleteConversation,
  onClose,
}: ChatSettingsDrawerProps) {
  const parsed = parseBackgroundValue(background);
  const [nicknameInput, setNicknameInput] = useState(nickname ?? "");
  const [selectedBubble, setSelectedBubble] = useState(parsed.bubble);
  const [customBgImage, setCustomBgImage] = useState(parsed.image);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const bgFileRef = useRef<HTMLInputElement | null>(null);

  const sharedImages = messages.filter(
    (m) => Boolean(m.imageUrl) && !m.deletedAt,
  );
  const isCustomBg =
    customBgImage.startsWith("http://") ||
    customBgImage.startsWith("https://") ||
    customBgImage.startsWith("data:image/");

  const emitPreview = (
    nextNick: string,
    nextBubble: string,
    nextImg: string,
  ) => {
    onPreviewChange?.({
      nickname: nextNick.trim() || null,
      background: serializeBackgroundValue(nextBubble, nextImg),
    });
  };

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Ukuran gambar maksimal 1,5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomBgImage(reader.result);
        setError(null);
        emitPreview(nicknameInput, selectedBubble, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!conversationId || isSelfNotes) return;
    setSaving(true);
    setError(null);

    const nextNickname = nicknameInput.trim() || null;
    const nextBackground = serializeBackgroundValue(
      selectedBubble,
      customBgImage,
    );

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nextNickname,
          background: nextBackground,
        }),
      });
      if (!res.ok) {
        setError("Gagal menyimpan pengaturan.");
        return;
      }
      onSaveSettings({
        nickname: nextNickname,
        background: nextBackground,
      });
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    setDeleting(true);
    setDeleteError(null);
    const ok = await onDeleteConversation(conversationId);
    setDeleting(false);
    if (ok) {
      onClose();
    } else {
      setDeleteError("Gagal menghapus percakapan.");
    }
  };

  return (
    <>
      <aside className="absolute inset-0 z-20 flex flex-col border-l border-white/75 bg-white/85 backdrop-blur-xl lg:static lg:w-80 lg:shrink-0 lg:bg-white/45">
        <div className="flex items-center justify-between border-b border-white/75 px-4 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === "media" ? "Galeri Media" : "Pengaturan Obrolan"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!isSelfNotes && (
          <div className="flex gap-4 border-b border-white/75 px-4 pt-2.5">
            <button
              type="button"
              onClick={() => onChangeMode("settings")}
              className={`border-b-2 pb-2 text-xs font-medium transition ${
                mode === "settings"
                  ? "border-[#b85c7a] font-semibold text-[#b85c7a]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Pengaturan
            </button>
            <button
              type="button"
              onClick={() => onChangeMode("media")}
              className={`border-b-2 pb-2 text-xs font-medium transition ${
                mode === "media"
                  ? "border-[#b85c7a] font-semibold text-[#b85c7a]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Media ({sharedImages.length})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {mode === "settings" && !isSelfNotes ? (
            <div className="divide-y divide-white/75">
              <div className="pb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNicknameInput(value);
                    emitPreview(value, selectedBubble, customBgImage);
                  }}
                  placeholder={displayName}
                  maxLength={32}
                  className="w-full rounded-xl border border-white/85 bg-white/70 px-3 py-2 text-xs text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#b85c7a]/60 focus:bg-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Kosongkan untuk kembali ke nama asli.
                </p>
              </div>

              <div className="py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Warna Balon & Latar
                  </span>
                  <input
                    ref={bgFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadBg}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgFileRef.current?.click()}
                    className="text-[11px] font-medium text-[#b85c7a] underline underline-offset-2 transition hover:text-[#9e4865]"
                  >
                    Gambar latar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {CHAT_THEMES.map((item) => {
                    const active = selectedBubble === item.id;
                    return (
                      <button
                        key={item.id || "default"}
                        type="button"
                        onClick={() => {
                          setSelectedBubble(item.id);
                          emitPreview(nicknameInput, item.id, customBgImage);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                          active
                            ? "bg-white font-semibold text-slate-900 ring-1 ring-[#b85c7a]"
                            : "bg-white/55 text-slate-600 hover:bg-white/85"
                        }`}
                      >
                        <span
                          className={`h-3.5 w-3.5 shrink-0 rounded-full ${item.swatch}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isCustomBg && (
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={customBgImage}
                        alt="Latar pilihan"
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-md object-cover"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Latar kustom
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBgImage("");
                        emitPreview(nicknameInput, selectedBubble, "");
                      }}
                      className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-white hover:text-slate-700"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="pr-3">
                  <p className="text-xs font-medium text-slate-800">
                    Mode Menghilang
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Tampilan gelap sementara untuk obrolan ini
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={vanishMode}
                  onClick={() => onToggleVanish(!vanishMode)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                    vanishMode ? "bg-[#b85c7a]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-xs transition-transform ${
                      vanishMode ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4">
                <p className="text-xs font-medium text-slate-800">
                  Hapus Percakapan
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Percakapan akan dihapus dari daftar Anda.
                </p>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(true);
                      setDeleteError(null);
                    }}
                    className="mt-2.5 text-xs font-semibold text-[#9e4865] underline underline-offset-2 transition hover:text-[#b85c7a]"
                  >
                    Hapus Percakapan
                  </button>
                ) : (
                  <div className="mt-2.5 space-y-2">
                    <p className="text-[11px] font-medium text-[#9e4865]">
                      Yakin ingin menghapus percakapan ini?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDeleteConversation()}
                        disabled={deleting}
                        className="rounded-lg bg-[#b85c7a] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#9e4865] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleting ? "Menghapus..." : "Ya, Hapus"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-white/70 disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {deleteError && (
                  <p className="mt-2 text-[11px] font-medium text-rose-600">
                    {deleteError}
                  </p>
                )}
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {error}
                </p>
              )}
            </div>
          ) : sharedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-12 text-center">
              <svg
                className="mb-2 h-6 w-6 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <p className="text-xs font-medium text-slate-600">
                Belum ada media
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Foto yang dikirim di obrolan ini akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sharedImages.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => setPreviewImage(msg.imageUrl)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/85 bg-white/60"
                >
                  <Image
                    src={msg.imageUrl!}
                    alt="Media dibagikan"
                    fill
                    unoptimized
                    className="object-cover transition duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === "settings" && !isSelfNotes && (
          <div className="border-t border-white/75 p-4">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full rounded-xl bg-[#b85c7a] py-2.5 text-xs font-semibold text-white transition hover:bg-[#9e4865] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        )}
      </aside>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl bg-slate-900 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label="Tutup pratinjau"
              className="absolute top-3 right-3 z-10 rounded-full bg-slate-900/70 p-2 text-white transition hover:bg-slate-900"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <Image
              src={previewImage}
              alt="Pratinjau media"
              width={960}
              height={720}
              unoptimized
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}