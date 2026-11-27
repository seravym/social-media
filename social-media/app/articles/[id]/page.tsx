"use client";

import { Suspense, useEffect, useState } from "react";import Link from "next/link";
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
    liked: boolean;
    saved: boolean;
    isOwner: boolean;
};

type Comment = {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null; username: string } | null;
    isOwner: boolean;
};

const MAX_COMMENT = 500;

const readTime = (text: string) =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

function ArticleDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [article, setArticle] = useState<Article | null>(null);
    const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
    const [deleting, setDeleting] = useState(false);

    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [commentError, setCommentError] = useState("");
    const [posting, setPosting] = useState(false);

    async function loadComments() {
        const res = await fetch(`/api/articles/${id}/comments`);
        if (res.ok) setComments(await res.json());
    }

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
            loadComments();
        } catch {
            if (!cancelled) setStatus("error");
        }
        })();
        return () => {
        cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function toggleLike() {
        if (!article) return;
        const res = await fetch(`/api/articles/${id}/like`, { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        setArticle({ ...article, liked: data.liked, likeCount: data.likeCount });
    }

    async function toggleSave() {
        if (!article) return;
        const res = await fetch(`/api/articles/${id}/bookmark`, { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        setArticle({ ...article, saved: data.saved });
    }

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

    async function submitComment() {
        setCommentError("");
        if (!text.trim()) return setCommentError("Komentar tidak boleh kosong.");
        if (text.length > MAX_COMMENT)
        return setCommentError(`Komentar maksimal ${MAX_COMMENT} karakter.`);

        setPosting(true);
        try {
        const res = await fetch(`/api/articles/${id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text }),
        });
        const data = await res.json();
        if (!res.ok) return setCommentError(data.error ?? "Gagal mengirim komentar.");
        setText("");
        await loadComments();
        setArticle((a) => (a ? { ...a, commentCount: a.commentCount + 1 } : a));
        } finally {
        setPosting(false);
        }
    }

    async function deleteComment(commentId: string) {
        if (!confirm("Hapus komentar ini?")) return;
        const res = await fetch(`/api/articles/${id}/comments/${commentId}`, {
        method: "DELETE",
        });
        if (!res.ok) return;
        setComments((list) => list.filter((c) => c.id !== commentId));
        setArticle((a) => (a ? { ...a, commentCount: Math.max(0, a.commentCount - 1) } : a));
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Link href="/articles" aria-label="Kembali" className="text-xl">
                ←
            </Link>
            <h1 className="text-2xl font-bold text-pink-600">Articles</h1>
            </div>
            <Link
            href="/articles/new"
            className="rounded-full bg-pink-600 px-4 py-2 text-base font-semibold text-white hover:bg-pink-700"
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
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                {article.category}
                </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold">{article.title}</h2>
            <p className="mt-2 text-base text-gray-500">
                {article.author.name ?? article.author.username} @{article.author.username} ·{" "}
                {formatDate(article.createdAt)} · {readTime(article.content)} mnt baca
            </p>

            <div className="mt-4 space-y-4 text-base leading-relaxed">
                {article.content.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                    {p}
                </p>
                ))}
            </div>

            {/* aksi: suka, komentar, tayangan, simpan, hapus */}
            <div className="mt-6 flex items-center gap-5 border-t border-gray-200 pt-3 text-base text-gray-500">
                <button
                onClick={toggleLike}
                className={article.liked ? "font-semibold text-pink-600" : "hover:text-pink-600"}
                >
                {article.liked ? "♥" : "♡"} {article.likeCount}
                </button>
                <span>💬 {article.commentCount}</span>
                <span>{article.views} tayangan</span>
                <button
                onClick={toggleSave}
                className={article.saved ? "font-semibold text-pink-600" : "hover:text-pink-600"}
                >
                {article.saved ? "Tersimpan" : "Simpan"}
                </button>
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

            {/* komentar */}
            <section className="mt-8">
                <h3 className="font-bold">Komentar ({article.commentCount})</h3>

                <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Tulis komentar Anda"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
                <div className="mt-1 flex items-center justify-between">
                <span
                    className={`text-sm ${text.length > MAX_COMMENT ? "text-red-600" : "text-gray-500"}`}
                >
                    {text.length}/{MAX_COMMENT}
                </span>
                <button
                    onClick={submitComment}
                    disabled={posting}
                    className="rounded-full bg-pink-600 px-4 py-1.5 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                >
                    {posting ? "Mengirim..." : "Kirim"}
                </button>
                </div>
                {commentError && <p className="mt-1 text-base text-red-600">{commentError}</p>}

                {comments.length === 0 ? (
                <p className="mt-4 text-base text-gray-500">Belum ada komentar. Jadilah yang pertama.</p>
                ) : (
                <ul className="mt-4 space-y-4">
                    {comments.map((c) => (
                    <li key={c.id} className="border-b border-gray-100 pb-3">
                        <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">
                            {c.author?.name ?? c.author?.username ?? "Pengguna"}
                        </span>{" "}
                        @{c.author?.username ?? "-"} · {formatDate(c.createdAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-base">{c.content}</p>
                        {c.isOwner && (
                        <button
                            onClick={() => deleteComment(c.id)}
                            className="mt-1 text-sm text-red-600 hover:underline"
                        >
                            Hapus
                        </button>
                        )}
                    </li>
                    ))}
                </ul>
                )}
            </section>
            </article>
        )}
        </main>
    );
}
export default function ArticleDetailPage() {
    return (
        <Suspense fallback={<p className="py-8 text-center text-gray-500">Memuat...</p>}>
        <ArticleDetail />
        </Suspense>
    );
}