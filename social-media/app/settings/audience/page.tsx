// Simpan sebagai: app/settings/audience/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Audience = {
  protectPosts: boolean;
  allowPhotoTag: boolean;
  showInSuggestions: boolean;
  whoCanReply: string;
  whoCanTag: string;
  whoCanMessage: string;
};

const REPLY_OPTIONS = [
  { value: "everyone", label: "Semua orang" },
  { value: "following", label: "Orang yang Anda ikuti" },
  { value: "mentioned", label: "Hanya akun yang Anda sebut" },
];
const PEOPLE_OPTIONS = [
  { value: "everyone", label: "Semua orang" },
  { value: "following", label: "Orang yang Anda ikuti" },
  { value: "none", label: "Tidak ada" },
];

export default function AudienceSettingsPage() {
  const [s, setS] = useState<Audience | null>(null);
  const [notice, setNotice] = useState<"" | "saved" | "failed">("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      if (res.ok) setS(await res.json());
    })();
  }, []);

  // simpan otomatis setiap ada perubahan
  async function change<K extends keyof Audience>(key: K, value: Audience[K]) {
    if (!s) return;
    const previous = s;
    setS({ ...s, [key]: value });
    setNotice("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      setNotice("saved");
    } catch {
      setS(previous); // kembalikan kalau gagal
      setNotice("failed");
    }
  }

  const toggle = (key: keyof Audience, title: string, desc: string) => (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0">
      <div className="pr-4">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={!!s?.[key]}
        onClick={() => change(key, !s?.[key] as never)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          s?.[key] ? "bg-pink-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
            s?.[key] ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );

  const radios = (
    key: "whoCanReply" | "whoCanTag" | "whoCanMessage",
    title: string,
    desc: string,
    options: { value: string; label: string }[]
  ) => (
    <section className="mb-4 overflow-hidden rounded-xl border border-gray-200">
      <div className="px-4 pt-4">
        <h2 className="text-base font-bold">{title}</h2>
        <p className="mb-2 text-sm text-gray-500">{desc}</p>
      </div>
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-3 border-t border-gray-100 px-4 py-3 text-base"
        >
          <input
            type="radio"
            name={key}
            checked={s?.[key] === o.value}
            onChange={() => change(key, o.value)}
            className="accent-pink-600"
          />
          {o.label}
        </label>
      ))}
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-2 flex items-center gap-4">
        <Link href="/settings" aria-label="Kembali" className="text-2xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-pink-600">Audiens dan penandaan</h1>
      </div>
      <p className="mb-6 text-base text-gray-500">
        Atur siapa yang bisa berinteraksi dengan Anda. Perubahan tersimpan otomatis.
      </p>

      {!s ? (
        <p className="py-8 text-center text-gray-500">Memuat...</p>
      ) : (
        <>
          <section className="mb-4 overflow-hidden rounded-xl border border-gray-200">
            <h2 className="px-4 pt-4 text-base font-bold">Privasi</h2>
            {toggle("protectPosts", "Lindungi postingan saya", "Hanya pengikut yang Anda setujui yang bisa melihat postingan Anda.")}
            {toggle("allowPhotoTag", "Izinkan penandaan foto", "Orang lain bisa menandai Anda di foto yang mereka unggah.")}
            {toggle("showInSuggestions", "Tampilkan akun saya di rekomendasi", "Akun Anda bisa muncul di bagian \"Akun untuk diikuti\".")}
          </section>

          {radios("whoCanReply", "Siapa yang bisa membalas", "Berlaku untuk postingan baru yang Anda buat.", REPLY_OPTIONS)}
          {radios("whoCanTag", "Siapa yang bisa menandai Anda", "Mengatur siapa yang boleh menyebut atau menandai Anda.", PEOPLE_OPTIONS)}
          {radios("whoCanMessage", "Siapa yang bisa mengirim pesan", "Mengatur siapa yang boleh mengirim pesan langsung kepada Anda.", PEOPLE_OPTIONS)}

          <p
            className={`h-5 text-sm ${notice === "failed" ? "text-red-600" : "text-green-600"}`}
          >
            {notice === "saved" && "Tersimpan"}
            {notice === "failed" && "Gagal menyimpan. Coba lagi."}
          </p>
        </>
      )}
    </main>
  );
}