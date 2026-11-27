"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; value: string };
type Lists = { words: Item[]; muted: Item[]; blocked: Item[] };
type Tab = "words" | "muted" | "blocked";

const TABS: {
    key: Tab;
    type: "word" | "muted" | "blocked";
    label: string;
    placeholder: string;
    remove: string;
    empty: string;
}[] = [
    { key: "words", type: "word", label: "Kata", placeholder: "Kata atau frasa yang ingin di-mute", remove: "Hapus", empty: "Belum ada kata yang di-mute." },
    { key: "muted", type: "muted", label: "Akun di-mute", placeholder: "@username yang ingin di-mute", remove: "Unmute", empty: "Belum ada akun yang di-mute." },
    { key: "blocked", type: "blocked", label: "Akun diblokir", placeholder: "@username yang ingin diblokir", remove: "Unblock", empty: "Belum ada akun yang diblokir." },
];

export default function MuteBlockPage() {
    const [lists, setLists] = useState<Lists>({ words: [], muted: [], blocked: [] });
    const [tab, setTab] = useState<Tab>("words");
    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    async function load() {
        const res = await fetch("/api/settings/mute-block");
        if (res.ok) setLists(await res.json());
        setLoading(false);
    }

    useEffect(() => {
    let cancelled = false;
    (async () => {
        const res = await fetch("/api/settings/mute-block");
        if (cancelled) return;
        if (res.ok) setLists(await res.json());
        setLoading(false);
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
        if (!value.trim()) return setError("Isian tidak boleh kosong.");

        const res = await fetch("/api/settings/mute-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: current.type, value }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error ?? "Gagal menambahkan.");

        setValue("");
        await load();
    }

    async function remove(id: string) {
        const res = await fetch(
        `/api/settings/mute-block?type=${current.type}&id=${id}`,
        { method: "DELETE" }
        );
        if (res.ok) setLists((l) => ({ ...l, [tab]: l[tab].filter((i) => i.id !== id) }));
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-2 flex items-center gap-4">
            <Link href="/settings" aria-label="Kembali" className="text-2xl">
            ←
            </Link>
            <h1 className="text-2xl font-bold text-pink-600">Mute dan blokir</h1>
        </div>
        <p className="mb-6 text-base text-gray-500">
            Atur kata dan akun yang tidak ingin Anda lihat atau yang tidak boleh berinteraksi dengan Anda.
        </p>

        <div className="mb-4 flex border-b border-gray-200">
            {TABS.map((t) => (
            <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex-1 pb-3 text-base font-semibold ${
                tab === t.key
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
            >
                {t.label}{" "}
                <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-600">
                {lists[t.key].length}
                </span>
            </button>
            ))}
        </div>

        <div className="flex gap-3">
            <input
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={current.placeholder}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
            <button
            onClick={add}
            className="rounded-full bg-pink-600 px-6 py-2 text-base font-semibold text-white hover:bg-pink-700"
            >
            Tambah
            </button>
        </div>
        {error && <p className="mt-2 text-base text-red-600">{error}</p>}

        {loading ? (
            <p className="py-8 text-center text-gray-500">Memuat...</p>
        ) : lists[tab].length === 0 ? (
            <p className="py-8 text-center text-gray-500">{current.empty}</p>
        ) : (
            <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
            {lists[tab].map((item) => (
                <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-base">
                    {tab === "words" ? item.value : `@${item.value}`}
                </span>
                <button
                    onClick={() => remove(item.id)}
                    className="rounded-full border border-gray-300 px-4 py-1 text-sm font-semibold hover:bg-gray-50"
                >
                    {current.remove}
                </button>
                </li>
            ))}
            </ul>
        )}
        </main>
    );
}