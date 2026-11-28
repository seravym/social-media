"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ExploreSidebar from "@/components/social/ExploreSidebar";
import Image from "next/image";

type Article = {
    id: string;
    title: string;
    content: string;
    category: string;
    coverImageUrl?: string | null;
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
    <div className="bg-dot-canvas min-h-dvh text-slate-900">
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <main className="glass-panel min-w-0 overflow-hidden rounded-2xl p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-[#b85c7a]">Articles</h1>
            <Link
            href="/articles/new"
            className="shrink-0 rounded-full bg-[#b85c7a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#9e4865] sm:px-4 sm:text-base">
            New Articles
            </Link>
        </div>

        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari artikel atau penulis"
            className="mb-4 w-full rounded-full bg-gray-100 px-4 py-2 text-base outline-none focus:ring-2 focus:ring-pink-400"
        />

        <div className="mb-4 flex gap-3 overflow-x-auto border-b border-gray-200 sm:gap-4">
            {TABS.map((t) => (
            <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-2.5 text-sm font-medium transition sm:text-base ${
                tab === t
                    ? "border-[#b85c7a] font-semibold text-[#9e4865]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
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
                <div
                    className={`relative flex h-36 items-end overflow-hidden rounded-xl p-3 sm:h-40 ${
                        a.coverImageUrl
                            ? ""
                            : "bg-gradient-to-br from-pink-500 to-rose-700"
                    }`}
                >
                    {a.coverImageUrl && (
                        <Image
                            src={a.coverImageUrl}
                            alt={a.title}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    )}

                    {a.coverImageUrl && (
                        <div className="absolute inset-0 bg-black/20" />
                    )}

                    <span className="relative rounded-full bg-white px-3 py-1 text-sm font-semibold">
                        {a.category}
                    </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    {a.author.name ?? a.author.username} @{a.author.username} ·{" "}
                    {formatDate(a.createdAt)} · {readTime(a.content)} mnt baca
                </p>
                <h2 className="mt-1 break-words text-lg font-bold sm:text-xl">{a.title}</h2>
                <p className="mt-1 line-clamp-2 text-base text-gray-600">{a.content}</p>
                <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-gray-500 sm:text-sm">
                    <span>♥ {a.likeCount}</span>
                    <span>💬 {a.commentCount}</span>
                    <span>{a.views} tayangan</span>
                </p>
                </Link>
            </li>
            ))}
        </ul>
    </main>
    <ExploreSidebar/>
    </div>
    </div>
    );
}