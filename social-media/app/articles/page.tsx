"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Article = {
    id: string;
    title: string;
    content: string;
    category: string;
    views: number;
    createdAt: string;
    author: { name: string | null; username: string };
    likeCount: number;
    commentCount: number;
    saved: boolean;
};

const TABS = ["For You", "Technology", "Design", "Data", "Food", "Travel", "Saved"];

const readTime = (text: string) =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

export default function ArticlesPage() {
    const [tab, setTab] = useState("For You");
    const [query, setQuery] = useState("");
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // jeda 300 ms supaya tidak memanggil API di setiap ketikan
        const timer = setTimeout(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (tab === "Saved") params.set("saved", "1");
            else if (tab !== "For You") params.set("category", tab);
            if (query.trim()) params.set("q", query.trim());

            const res = await fetch(`/api/articles?${params.toString()}`);
            if (!res.ok) throw new Error("Gagal memuat artikel");
            setArticles(await res.json());
        } catch {
            setError("Artikel gagal dimuat. Coba lagi.");
        } finally {
            setLoading(false);
        }
        }, 300);
        return () => clearTimeout(timer);
    }, [tab, query]);

    return (
        <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-pink-600">Articles</h1>
            <Link
            href="/articles/new"
            className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
            New Articles
            </Link>
        </div>

        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari artikel atau penulis"
            className="mb-4 w-full rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
        />

        <div className="mb-4 flex gap-4 overflow-x-auto border-b border-gray-200">
            {TABS.map((t) => (
            <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap pb-2 text-sm font-semibold ${
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
        {error && <p className="py-8 text-center text-red-600">{error}</p>}

        {!loading && !error && articles.length === 0 && (
            <p className="py-8 text-center text-gray-500">
            {tab === "Saved"
                ? "Belum ada artikel yang disimpan."
                : "Tidak ada artikel yang cocok."}
            </p>
        )}

        <ul className="space-y-6">
            {articles.map((a) => (
            <li key={a.id}>
                <Link href={`/articles/${a.id}`} className="block">
                <div className="flex h-40 items-end rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 p-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
                    {a.category}
                    </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    {a.author.name ?? a.author.username} @{a.author.username} ·{" "}
                    {formatDate(a.createdAt)} · {readTime(a.content)} mnt baca
                </p>
                <h2 className="mt-1 text-lg font-bold">{a.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.content}</p>
                <p className="mt-2 text-xs text-gray-500">
                    ♥ {a.likeCount} · 💬 {a.commentCount} · {a.views} tayangan
                </p>
                </Link>
            </li>
            ))}
        </ul>
        </main>
    );
}