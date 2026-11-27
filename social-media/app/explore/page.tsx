"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type News = { id: string; title: string; summary: string; category: string; postCount: number; createdAt: string };
type Trend = { id: string; name: string; category: string; postCount: number };
type Account = { id: string; name: string | null; username: string };
type HistoryItem = { id: string; query: string };

const TABS = ["Explore", "Trending", "News", "Sports", "Entertainment"] as const;
type Tab = (typeof TABS)[number];

const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} rb postingan` : `${n} postingan`;

function timeAgo(iso: string) {
    const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (hours < 1) return "Baru saja";
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
}

function Highlight({ text, query }: { text: string; query: string }) {
    const words = query
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!words.length) return <>{text}</>;
    const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
    return (
        <>
        {parts.map((p, i) =>
            i % 2 === 1 ? (
            <mark key={i} className="bg-pink-100 text-inherit">
                {p}
            </mark>
            ) : (
            p
            )
        )}
        </>
    );
}

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("Explore");
    const [query, setQuery] = useState("");
    const [news, setNews] = useState<News[]>([]);
    const [trending, setTrending] = useState<Trend[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(true);

    async function loadHistory() {
        const res = await fetch("/api/explore/history");
        if (res.ok) setHistory(await res.json());
    }

        useEffect(() => {
        let cancelled = false;
        (async () => {
        const res = await fetch("/api/explore/history");
        if (!cancelled && res.ok) setHistory(await res.json());
        })();
        return () => {
        cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/explore?q=${encodeURIComponent(query.trim())}`);
            if (res.ok) {
            const data = await res.json();
            setNews(data.news);
            setTrending(data.trending);
            setAccounts(data.accounts);
            }
        } finally {
            setLoading(false);
        }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    async function saveSearch(q: string) {
        if (!q.trim()) return;
        await fetch("/api/explore/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        });
        loadHistory();
    }

    async function removeHistory(id: string) {
        await fetch(`/api/explore/history?id=${id}`, { method: "DELETE" });
        setHistory((h) => h.filter((i) => i.id !== id));
    }

    async function clearHistory() {
        await fetch("/api/explore/history?all=1", { method: "DELETE" });
        setHistory([]);
    }

    const byCategory = <T extends { category: string }>(list: T[]) =>
        tab === "Explore" || tab === "Trending" ? list : list.filter((i) => i.category === tab);

    const shownNews = tab === "Trending" ? [] : byCategory(news);
    const allTrending = byCategory(trending);
    const shownTrending = tab === "Explore" && !query.trim() ? allTrending.slice(0, 5) : allTrending;
    const searching = query.trim().length > 0;
    const nothing =
        !loading && !shownNews.length && !shownTrending.length && !(searching && accounts.length);

    const section = (title: string, children: React.ReactNode) => (
        <section className="mb-6">
        <h2 className="mb-3 text-xl font-bold">{title}</h2>
        {children}
        </section>
    );

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="relative mb-4 flex items-center gap-4">
            <Link href="/home" aria-label="Kembali" className="text-2xl">
            ←
            </Link>
            <div className="relative w-full">
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && saveSearch(query)}
                placeholder="Cari topik, akun, atau berita"
                className="w-full rounded-full bg-gray-100 px-5 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-pink-400"
            />

            {focused && !searching && history.length > 0 && (
                <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-base font-bold">Pencarian terbaru</span>
                    <button onClick={clearHistory} className="text-sm font-semibold text-pink-600">
                    Hapus semua
                    </button>
                </div>
                {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                    <button
                        onClick={() => {
                        setQuery(h.query);
                        saveSearch(h.query);
                        }}
                        className="flex-1 text-left text-base"
                    >
                        🕒 {h.query}
                    </button>
                    <button
                        onClick={() => removeHistory(h.id)}
                        aria-label={`Hapus ${h.query}`}
                        className="px-2 text-gray-500 hover:text-gray-800"
                    >
                        ✕
                    </button>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>

        <div className="mb-6 flex border-b border-gray-200">
            {TABS.map((t) => (
            <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 pb-3 text-base font-semibold ${
                tab === t
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
            >
                {t}
            </button>
            ))}
        </div>

        {loading && <p className="py-8 text-center text-gray-500">Memuat...</p>}

        {!loading && (
            <>
            {shownNews.length > 0 &&
                section(
                "Berita Hari Ini",
                <ul className="space-y-4">
                    {shownNews.map((n) => (
                    <li key={n.id} className="border-b border-gray-100 pb-3">
                        <p className="text-base font-bold">
                        <Highlight text={n.title} query={query} />
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                        {timeAgo(n.createdAt)} · {n.category} · {formatCount(n.postCount)}
                        </p>
                    </li>
                    ))}
                </ul>
                )}

            {shownTrending.length > 0 &&
                section(
                "Trending",
                <ol className="space-y-4">
                    {shownTrending.map((t, i) => (
                    <li key={t.id} className="flex gap-4 border-b border-gray-100 pb-3">
                        <span className="w-5 text-sm text-gray-500">{i + 1}</span>
                        <div>
                        <p className="text-sm text-gray-500">
                            {t.category} · Trending di Indonesia
                        </p>
                        <p className="text-base font-bold">
                            <Highlight text={t.name} query={query} />
                        </p>
                        <p className="text-sm text-gray-500">{formatCount(t.postCount)}</p>
                        </div>
                    </li>
                    ))}
                </ol>
                )}

            {searching &&
                accounts.length > 0 &&
                section(
                "Akun untuk diikuti",
                <ul className="space-y-3">
                    {accounts.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-700">
                        {(a.name ?? a.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                        <p className="text-base font-bold">
                            <Highlight text={a.name ?? a.username} query={query} />
                        </p>
                        <p className="text-sm text-gray-500">
                            @<Highlight text={a.username} query={query} />
                        </p>
                        </div>
                    </li>
                    ))}
                </ul>
                )}

            {nothing && (
                <p className="py-8 text-center text-gray-500">
                {searching ? `Tidak ada hasil untuk "${query.trim()}".` : "Belum ada konten."}
                </p>
            )}
            </>
        )}
        </main>
    );
}