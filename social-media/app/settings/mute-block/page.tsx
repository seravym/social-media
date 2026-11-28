"use client";

import { useEffect, useState } from "react";
import SettingsPageLayout from "@/components/settings/SettingsPageLayout";

type Item = {
    id: string;
    value: string;
};

type Lists = {
    words: Item[];
    muted: Item[];
    blocked: Item[];
};

type Tab = "words" | "muted" | "blocked";

const TABS: {
    key: Tab;
    type: "word" | "muted" | "blocked";
    label: string;
    placeholder: string;
    remove: string;
    empty: string;
}[] = [
    {
        key: "words",
        type: "word",
        label: "Kata",
        placeholder: "Kata atau frasa yang ingin di-mute",
        remove: "Hapus",
        empty: "Belum ada kata yang di-mute.",
    },
    {
        key: "muted",
        type: "muted",
        label: "Akun di-mute",
        placeholder: "@username yang ingin di-mute",
        remove: "Unmute",
        empty: "Belum ada akun yang di-mute.",
    },
    {
        key: "blocked",
        type: "blocked",
        label: "Akun diblokir",
        placeholder: "@username yang ingin diblokir",
        remove: "Unblock",
        empty: "Belum ada akun yang diblokir.",
    },
];

export default function MuteBlockPage() {
    const [lists, setLists] = useState<Lists>({
        words: [],
        muted: [],
        blocked: [],
    });
    const [tab, setTab] = useState<Tab>("words");
    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    async function load() {
        const res = await fetch("/api/settings/mute-block");
        if (res.ok) {
        setLists(await res.json());
        }
        setLoading(false);
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
        try {
            const res = await fetch("/api/settings/mute-block");
            if (cancelled) return;
            if (res.ok) {
            setLists(await res.json());
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        })();

        return () => {
        cancelled = true;
        };
    }, []);

    const current = TABS.find((t) => t.key === tab)!;
    function switchTab(next: Tab) {
        setTab(next);
        setValue("");
        setError("");
    }

    async function add() {
        setError("");
        if (!value.trim()) {
        setError("Isian tidak boleh kosong.");
        return;
        }

        const res = await fetch("/api/settings/mute-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: current.type,
            value,
        }),
        });

        const data = await res.json();
        if (!res.ok) {
        setError(data.error ?? "Gagal menambahkan.");
        return;
        }

        setValue("");
        await load();
    }

    async function remove(id: string) {
        const res = await fetch(
        `/api/settings/mute-block?type=${current.type}&id=${id}`,
        { method: "DELETE" }
        );

        if (res.ok) {
        setLists((l) => ({
            ...l,
            [tab]: l[tab].filter((i) => i.id !== id),
        }));
        }
    }

    return (
        <SettingsPageLayout
        title="Mute dan blokir"
        description="Atur kata dan akun yang tidak ingin Anda lihat."
        >
        <div className="flex overflow-x-auto border-b border-white/65">
            {TABS.map((t) => (
            <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`flex shrink-0 items-center justify-center gap-1 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition sm:flex-1 sm:px-4 ${
                tab === t.key
                    ? "border-[#b85c7a] text-[#b85c7a]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
            >
                {t.label}
                <span className="rounded-full bg-[#faf0f3] px-2 py-0.5 text-xs text-[#b85c7a]">
                {lists[t.key].length}
                </span>
            </button>
            ))}
        </div>
        <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:px-5">
            <input
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                setError("");
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") void add();
            }}
            placeholder={current.placeholder}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none transition focus:border-[#b85c7a] focus:ring-2 focus:ring-[#f0d5de]"
            />
            <button
            type="button"
            onClick={() => void add()}
            className="shrink-0 rounded-full bg-[#b85c7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9e4865]"
            >
            Tambah
            </button>
        </div>
        {error && (
            <p className="px-4 pb-2 text-xs text-rose-600 sm:px-5">
            {error}
            </p>
        )}
        {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
            Memuat...
            </p>
        ) : lists[tab].length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
            {current.empty}
            </p>
        ) : (
            <ul className="divide-y divide-white/65">
            {lists[tab].map((item) => (
                <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                <span className="min-w-0 break-words text-sm text-slate-900">
                    {tab === "words" ? item.value : `@${item.value}`}
                </span>
                <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="shrink-0 rounded-full border border-slate-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                >
                    {current.remove}
                </button>
                </li>
            ))}
            </ul>
        )}
        </SettingsPageLayout>
    );
}