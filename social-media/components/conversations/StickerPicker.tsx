"use client";

const STICKERS = [
  { id: "love", emoji: "💖", label: "Love You" },
  { id: "haha", emoji: "🤣", label: "Ngakak" },
  { id: "fire", emoji: "🔥", label: "Menyala" },
  { id: "slay", emoji: "✨", label: "Slay" },
  { id: "cry", emoji: "😭", label: "Terharu" },
  { id: "hug", emoji: "🫂", label: "Peluk" },
  { id: "coffee", emoji: "☕", label: "Ngopi" },
  { id: "party", emoji: "🥳", label: "Gas!" },
];

interface StickerPickerProps {
  onSelect: (stickerText: string) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <div className="absolute right-0 bottom-14 z-30 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Pilih Stiker
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => {
              onSelect(`[sticker:${sticker.emoji}:${sticker.label}]`);
              onClose();
            }}
            className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-2 transition hover:border-pink-200 hover:bg-pink-50"
          >
            <span className="text-2xl">{sticker.emoji}</span>
            <span className="mt-0.5 text-[10px] font-medium text-slate-600">
              {sticker.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
