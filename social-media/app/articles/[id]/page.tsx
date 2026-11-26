"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
    isOwner: boolean;
};

const readTime = (text: string) =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));

    const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    export default function ArticleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [article, setArticle] = useState<Article | null>(null);
    const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
        try {
            const res = await fetch(`/api/articles/${id}`);
            if (cancelled) return;
            if (res.status === 404) return setStatus("notfound");
            if (!res.ok) return setStatus("error");
            setArticle(await res.json());
            setStatus("ok");
        } catch {
            if (!cancelled) setStatus("error");
        }
        })();
        return () => {
        cancelled = true;
        };
    }, [id]);

    async function handleDelete() {
        if (!confirm("Hapus artikel ini? Tindakan ini tidak bisa dibatalkan.")) return;
        setDeleting(true);
        try {
        const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error ?? "Gagal menghapus artikel.");
            return;
        }
        router.push("/articles");
        } finally {
        setDeleting(false);
        }
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Link href="/articles" aria-label="Kembali" className="text-xl">
                ←
            </Link>
            <h1 className="text-xl font-bold text-pink-600">Articles</h1>
            </div>
            <Link
            href="/articles/new"
            className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
            New Articles
            </Link>
        </div>

        {status === "loading" && <p className="py-8 text-center text-gray-500">Memuat...</p>}
        {status === "notfound" && (
            <p className="py-8 text-center text-gray-500">Artikel tidak ditemukan.</p>
        )}
        {status === "error" && (
            <p className="py-8 text-center text-red-600">Artikel gagal dimuat. Coba lagi.</p>
        )}

        {status === "ok" && article && (
            <article>
            <div className="flex h-48 items-end rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 p-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
                {article.category}
                </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold">{article.title}</h2>
            <p className="mt-2 text-sm text-gray-500">
                {article.author.name ?? article.author.username} @{article.author.username} ·{" "}
                {formatDate(article.createdAt)} · {readTime(article.content)} mnt baca
            </p>

            <div className="mt-4 space-y-4 text-sm leading-relaxed">
                {article.content.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                    {p}
                </p>
                ))}
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-gray-200 pt-3 text-sm text-gray-500">
                <span>♥ {article.likeCount}</span>
                <span>💬 {article.commentCount}</span>
                <span>{article.views} tayangan</span>
                {article.isOwner && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="ml-auto text-red-600 hover:underline disabled:opacity-60"
                >
                    {deleting ? "Menghapus..." : "Hapus"}
                </button>
                )}
            </div>
            </article>
        )}
        </main>
    );
}