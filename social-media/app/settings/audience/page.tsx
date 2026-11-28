"use client";

import { useEffect, useState } from "react";
import SettingsPageLayout from "@/components/settings/SettingsPageLayout";

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

    async function change<K extends keyof Audience>(
        key: K,
        value: Audience[K]
    ) {
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
        setS(previous);
        setNotice("failed");
        }
    }

    const toggle = (
        key: "protectPosts" | "allowPhotoTag" | "showInSuggestions",
        title: string,
        desc: string
    ) => (
        <div className="flex items-center justify-between gap-4 border-t border-white/60 px-4 py-4 sm:px-5">
        <div className="min-w-0 pr-2">
            <p className="text-sm font-semibold text-slate-900">
            {title}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
            {desc}
            </p>
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={!!s?.[key]}
            aria-label={title}
            onClick={() => change(key, !s?.[key])}
            className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
            s?.[key] ? "bg-[#b85c7a]" : "bg-slate-200"
            }`}
        >
            <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                s?.[key] ? "translate-x-5" : "translate-x-1"
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
        <section className="border-t border-white/65">
        <div className="px-4 pt-4 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-900">
            {title}
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-slate-500">
            {desc}
            </p>
        </div>
        {options.map((o) => (
            <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 border-t border-white/60 px-4 py-3 text-sm text-slate-700 sm:px-5"
            >
            <input
                type="radio"
                name={key}
                checked={s?.[key] === o.value}
                onChange={() => change(key, o.value)}
                className="accent-[#b85c7a]"
            />
            {o.label}
            </label>
        ))}
        </section>
    );

    return (
        <SettingsPageLayout
        title="Audiens dan penandaan"
        description="Atur siapa yang bisa berinteraksi dengan Anda."
        status={
            notice ? (
            <span
                className={`shrink-0 text-xs font-medium ${
                notice === "saved"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
            >
                {notice === "saved" ? "Tersimpan" : "Gagal menyimpan"}
            </span>
            ) : undefined
        }
        >
        {!s ? (
            <p className="py-10 text-center text-sm text-slate-500">
            Memuat...
            </p>
        ) : (
            <>
            <section>
                <div className="px-4 pt-4 sm:px-5">
                <h2 className="text-sm font-semibold text-slate-900">
                    Privasi
                </h2>
                </div>
                {toggle(
                "protectPosts",
                "Lindungi postingan saya",
                "Hanya pengikut yang Anda setujui yang bisa melihat postingan Anda."
                )}
                {toggle(
                "allowPhotoTag",
                "Izinkan penandaan foto",
                "Orang lain bisa menandai Anda di foto yang mereka unggah."
                )}
                {toggle(
                "showInSuggestions",
                "Tampilkan akun saya di rekomendasi",
                'Akun Anda bisa muncul di bagian "Akun untuk diikuti".'
                )}
            </section>
            {radios(
                "whoCanReply",
                "Siapa yang bisa membalas",
                "Berlaku untuk postingan baru yang Anda buat.",
                REPLY_OPTIONS
            )}
            {radios(
                "whoCanTag",
                "Siapa yang bisa menandai Anda",
                "Mengatur siapa yang boleh menyebut atau menandai Anda.",
                PEOPLE_OPTIONS
            )}
            {radios(
                "whoCanMessage",
                "Siapa yang bisa mengirim pesan",
                "Mengatur siapa yang boleh mengirim pesan langsung kepada Anda.",
                PEOPLE_OPTIONS
            )}
            </>
        )}
        </SettingsPageLayout>
    );
}
