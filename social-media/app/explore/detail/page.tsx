"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type NewsDetail = {
    id: string;
    title: string;
    summary: string;
    category: string;
    postCount: number;
    createdAt: string;
};

type TrendingDetail = {
    id: string;
    name: string;
    category: string;
    postCount: number;
};

type InteractionComment = {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        username: string;
    };
};

type Interactions = {
    likeCount: number;
    savedCount: number;
    liked: boolean;
    saved: boolean;
    comments: InteractionComment[];
};

function formatCount(n: number) {
    return n >= 1000
        ? `${(n / 1000).toFixed(1).replace(".", ",")} rb postingan`
        : `${n} postingan`;
}

function DetailContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const validType = type === "news" || type === "trending";
    const [item, setItem] = useState<NewsDetail | TrendingDetail | null>(null);
    const [loading, setLoading] = useState(() => Boolean(id && validType));
    const [error, setError] = useState("");
    const [interactions, setInteractions] = useState<Interactions>({
        likeCount: 0,
        savedCount: 0,
        liked: false,
        saved: false,
        comments: [],
    });

    const [commentText, setCommentText] = useState("");
    const [interactionLoading, setInteractionLoading] = useState(false);
    const [interactionError, setInteractionError] = useState("");
    const refreshInteractions = useCallback(async () => {
        if (!id || !validType) return;
        const res = await fetch(
            `/api/explore/detail/interactions?type=${type}&id=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Gagal memuat interaksi.");
        }
        setInteractions(data);
    }, [id, type, validType]);

    useEffect(() => {
        if (!id || !validType) {
            return;
        }
        let cancelled = false;
        async function loadDetail() {
            try {
                const res = await fetch(
                    `/api/explore/detail?type=${type}&id=${encodeURIComponent(id!)}`
                );
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Gagal memuat detail.");
                }
                if (!cancelled) {
                    setItem(data.item);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Terjadi kesalahan saat memuat detail."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        loadDetail();
        return () => {
            cancelled = true;
        };
    }, [type, id, validType]);

    useEffect(() => {
        if (!id || !validType) return;
        let cancelled = false;
        async function loadInteractions() {
            try {
                const res = await fetch(
                    `/api/explore/detail/interactions?type=${type}&id=${encodeURIComponent(id!)}`
                );
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Gagal memuat interaksi.");
                }
                if (!cancelled) {
                    setInteractions(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setInteractionError(
                        err instanceof Error
                            ? err.message
                            : "Gagal memuat interaksi."
                    );
                }
            }
        }
        loadInteractions();
        return () => {
            cancelled = true;
        };
    }, [type, id, validType]);
    async function handleReaction(action: "like" | "saved") {
        if (!id || !validType || interactionLoading) return;
        setInteractionLoading(true);
        setInteractionError("");
        try {
            const res = await fetch(
                "/api/explore/detail/interactions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type,
                        id,
                        action,
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Gagal memperbarui interaksi.");
            }
            await refreshInteractions();
        } catch (err) {
            setInteractionError(
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan."
            );
        } finally {
            setInteractionLoading(false);
        }
    }
    async function handleComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!id || !validType || !commentText.trim() || interactionLoading) {
            return;
        }
        setInteractionLoading(true);
        setInteractionError("");
        try {
            const res = await fetch(
                "/api/explore/detail/interactions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type,
                        id,
                        action: "comment",
                        content: commentText,
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Gagal mengirim komentar.");
            }
            setCommentText("");
            await refreshInteractions();
        } catch (err) {
            setInteractionError(
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan."
            );
        } finally {
            setInteractionLoading(false);
        }
    }

    return (
        <div className="bg-dot-canvas min-h-dvh text-slate-900">
            <div className="mx-auto max-w-3xl px-3 py-5 sm:px-4">
                <main className="glass-panel rounded-2xl p-5">
                    <Link
                        href="/explore"
                        className="mb-6 inline-block text-sm font-semibold text-[#b85c7a] transition hover:underline"
                    >
                        ← Kembali ke Explore
                    </Link>
                    {loading && (
                        <p className="py-8 text-center text-gray-500">
                            Memuat detail...
                        </p>
                    )}
                    {!loading && error && (
                        <p className="py-8 text-center text-gray-500">
                            {error}
                        </p>
                    )}
                    {!loading && (!id || !validType) && (
                        <p className="py-8 text-center text-gray-500">
                            Detail tidak ditemukan.
                        </p>
                    )}
                    {!loading && !error && item && type === "news" && (
                        <>
                            <p className="mb-2 text-sm font-semibold text-[#b85c7a]">
                                {(item as NewsDetail).category} · Berita
                            </p>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {(item as NewsDetail).title}
                            </h1>
                            <p className="mt-4 text-base leading-7 text-gray-600">
                                {(item as NewsDetail).summary}
                            </p>
                            <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
                                {formatCount((item as NewsDetail).postCount)}
                            </div>
                        </>
                    )}
                    {!loading && !error && item && type === "trending" && (
                        <>
                            <p className="mb-2 text-sm font-semibold text-[#b85c7a]">
                                {(item as TrendingDetail).category} · Trending di Indonesia
                            </p>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {(item as TrendingDetail).name}
                            </h1>
                            <p className="mt-4 text-base leading-7 text-gray-600">
                                Topik ini sedang menjadi trending di Explore.
                            </p>
                            <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
                                {formatCount((item as TrendingDetail).postCount)}
                            </div>
                        </>
                    )}
                    {!loading && !error && item && (
                        <section className="mt-6 border-t border-gray-100 pt-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleReaction("like")}
                                    disabled={interactionLoading}
                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        interactions.liked
                                            ? "border-[#b85c7a] bg-[#b85c7a]/10 text-[#b85c7a]"
                                            : "border-gray-200 text-gray-600 hover:border-[#b85c7a] hover:text-[#b85c7a]"
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {interactions.liked ? "♥ Liked" : "♡ Like"} · {interactions.likeCount}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReaction("saved")}
                                    disabled={interactionLoading}
                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        interactions.saved
                                            ? "border-[#b85c7a] bg-[#b85c7a]/10 text-[#b85c7a]"
                                            : "border-gray-200 text-gray-600 hover:border-[#b85c7a] hover:text-[#b85c7a]"
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {interactions.saved ? "🔖 Saved" : "♧ Save"} · {interactions.savedCount}
                                </button>
                            </div>
                            {interactionError && (
                                <p className="mt-3 text-sm text-red-500">
                                    {interactionError}
                                </p>
                            )}
                            <div className="mt-7">
                                <h2 className="mb-4 text-lg font-bold text-slate-900">
                                    Komentar ({interactions.comments.length})
                                </h2>
                                <form onSubmit={handleComment} className="space-y-3">
                                    <textarea
                                        value={commentText}
                                        onChange={(event) => setCommentText(event.target.value)}
                                        placeholder="Tulis komentar..."
                                        maxLength={1000}
                                        rows={3}
                                        className="w-full resize-y rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[#b85c7a]"
                                    />
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-gray-400">
                                            {commentText.length}/1000
                                        </span>
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || interactionLoading}
                                            className="rounded-full bg-[#b85c7a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#9f4c68] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {interactionLoading ? "Mengirim..." : "Kirim komentar"}
                                        </button>
                                    </div>
                                </form>
                                <div className="mt-6 space-y-4">
                                    {interactions.comments.length === 0 && (
                                        <p className="py-4 text-center text-sm text-gray-400">
                                            Belum ada komentar. Jadilah yang pertama!
                                        </p>
                                    )}
                                    {interactions.comments.map((comment) => (
                                        <article
                                            key={comment.id}
                                            className="rounded-xl bg-white/60 p-4"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {comment.user.name || comment.user.username}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    @{comment.user.username}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    · {new Date(comment.createdAt).toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                                {comment.content}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function ExploreDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="py-8 text-center text-gray-500">
                    Memuat detail...
                </div>
            }
        >
            <DetailContent />
        </Suspense>
    );
}
