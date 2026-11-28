"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ExploreSidebar from "@/components/social/ExploreSidebar";

type News = { id: string; title: string; summary: string; category: string; postCount: number; createdAt: string };
type Trend = { id: string; name: string; category: string; postCount: number };
type Account = { id: string; name: string | null; username: string };
type Post = {
    id: string;
    content: string;
    category: string;
    replyCount: number;
    likeCount: number;
    views: number;
    createdAt: string;
    author: Account;
    _count: {
        comments: number;
        likes: number;
    };
};

type ExploreComment = {
    id: string;
    content: string;
};

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
            <mark key={i} className="rounded bg-[#f8e8ed] text-inherit">
                {p}
            </mark>
            ) : (
            p
            )
        )}
        </>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e8ed] font-bold text-[#b85c7a]">
        {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("Explore");
    const [query, setQuery] = useState("");
    const [news, setNews] = useState<News[]>([]);
    const [trending, setTrending] = useState<Trend[]>([]);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
    const [commentText, setCommentText] = useState<Record<string, string>>({});
    const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
    const [newComments, setNewComments] = useState<Record<string, ExploreComment[]>>({});
    const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [following, setFollowing] = useState<Record<string, boolean>>({});
    const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(true);

    async function loadHistory() {
        const res = await fetch("/api/explore/history");
        if (res.ok) setHistory(await res.json());
    }
    
    async function toggleFollow(accountId: string) {
        if (followLoading[accountId]) return;

        setFollowLoading((prev) => ({
            ...prev,
            [accountId]: true,
        }));
        try {
            const res = await fetch("/api/follow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    followingId: accountId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Gagal memproses follow");
                return;
            }
            setFollowing((prev) => ({
                ...prev,
                [accountId]: data.following,
            }));
        } catch {
            alert("Terjadi kesalahan saat memproses follow");
        } finally {
            setFollowLoading((prev) => ({
                ...prev,
                [accountId]: false,
            }));
        }
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
        let cancelled = false;
        async function loadFollowing() {
            try {
                const res = await fetch("/api/follow");
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) {
                    const status: Record<string, boolean> = {};
                    (data.users ?? []).forEach(
                        (user: { id: string; isFollowing: boolean }) => {
                            status[user.id] = user.isFollowing;
                        }
                    );
                    setFollowing(status);
                }
            } catch (error) {
                console.error("Gagal memuat status follow:", error);
            }
        }
        loadFollowing();
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
            setPosts(data.posts ?? []);
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

    const searching = query.trim().length > 0;
    const compact = tab === "Explore" && !searching;

    const shownNews = tab === "Trending" ? [] : byCategory(news);
    const allTrending = byCategory(trending);
    const shownTrending = compact ? allTrending.slice(0, 5) : allTrending;
    const allPosts = tab === "Trending" ? [] : (byCategory(posts ?? []) ?? []);
    const shownPosts = compact ? allPosts.slice(0, 5) : allPosts;
    const showAccounts = (tab === "Explore" || searching) && accounts.length > 0;

    const handleLikePost = async (postId: string) => {
        if (likeLoading[postId]) return;

        setLikeLoading((prev) => ({
            ...prev,
            [postId]: true,
        }));

        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Gagal memproses like");
                return;
            }

            setPosts((prev) =>
                prev.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            _count: {
                                ...post._count,
                                likes: data.liked
                                    ? post._count.likes + 1
                                    : Math.max(0, post._count.likes - 1),
                            },
                        }
                        : post
                )
            );
        } catch {
            alert("Terjadi kesalahan saat memproses like");
        } finally {
            setLikeLoading((prev) => ({
                ...prev,
                [postId]: false,
            }));
        }
    };

    const handleAddComment = async (postId: string) => {
        const content = commentText[postId]?.trim();

        if (!content || commentLoading[postId]) return;

        setCommentLoading((prev) => ({
            ...prev,
            [postId]: true,
        }));

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Gagal mengirim komentar");
                return;
            }

            const comment: ExploreComment = {
                id: data.comment?.id ?? `${postId}-${Date.now()}`,
                content: data.comment?.content ?? content,
            };

            setNewComments((prev) => ({
                ...prev,
                [postId]: [comment, ...(prev[postId] ?? [])],
            }));

            setPosts((prev) =>
                prev.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            _count: {
                                ...post._count,
                                comments: post._count.comments + 1,
                            },
                        }
                        : post
                )
            );

            setCommentText((prev) => ({
                ...prev,
                [postId]: "",
            }));
        } catch {
            alert("Terjadi kesalahan saat mengirim komentar");
        } finally {
            setCommentLoading((prev) => ({
                ...prev,
                [postId]: false,
            }));
        }
    };

    const nothing =
        !loading &&
        !shownNews.length &&
        !shownTrending.length &&
        !shownPosts.length &&
        !showAccounts;

    const section = (title: string, children: React.ReactNode) => (
        <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
        {children}
        </section>
    );

    return (
    <div className="bg-dot-canvas min-h-dvh text-slate-900">
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <main className="glass-panel overflow-hidden rounded-2xl p-5">
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
                placeholder="Cari topik, akun, atau postingan"
                className="w-full rounded-full border border-gray-200 bg-white/80 px-5 py-3 text-base outline-none transition focus:border-[#b85c7a] focus:ring-2 focus:ring-pink-200"
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
                className={`flex-1 pb-3 text-base font-semibold transition ${
                tab === t
                    ? "border-b-2 border-[#b85c7a] text-[#b85c7a]"
                    : "text-gray-500 hover:text-[#b85c7a]"
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
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedNews(n);
                                setSelectedTrend(null);
                            }}
                            className="text-left text-base font-bold transition hover:text-[#b85c7a]"
                        >
                            <Highlight text={n.title} query={query} />
                        </button>
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
                        <p className="text-sm text-gray-500">{t.category} · Trending di Indonesia</p>
                        <button type="button"
                            onClick={() => {
                                setQuery(t.name);
                                setTab("Explore");
                            }}
                            className="text-left text-base font-bold transition hover:text-[#b85c7a]">
                            <Highlight text={t.name} query={query} />
                        </button>
                        <p className="text-sm text-gray-500">{formatCount(t.postCount)}</p>
                        </div>
                    </li>
                    ))}
                </ol>
                )}

            {showAccounts &&
                section(
                "Akun untuk diikuti",
                <ul className="space-y-3">
                    {accounts.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                        <Avatar name={a.name ?? a.username} />
                        <div className="min-w-0 flex-1">
                            <Link
                                href={`/profile/${a.id}`}
                                className="text-base font-bold transition hover:text-[#b85c7a]"
                            >
                                <Highlight text={a.name ?? a.username} query={query} />
                            </Link>
                            <Link
                                href={`/profile/${a.id}`}
                                className="block text-sm text-gray-500 hover:text-[#b85c7a]"
                            >
                                @<Highlight text={a.username} query={query} />
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleFollow(a.id)}
                            disabled={!!followLoading[a.id]}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                following[a.id]
                                    ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                    : "bg-[#b85c7a] text-white hover:bg-[#9e4865]"
                            } disabled:opacity-50`}
                        >
                            {followLoading[a.id]
                                ? "Memproses..."
                                : following[a.id]
                                    ? "Following"
                                    : "Follow"}
                        </button>
                    </li>
                    ))}
                </ul>
                )}

            {shownPosts.length > 0 &&
                section(
                "Postingan populer",
                <ul className="space-y-4">
                    {shownPosts.map((p) => (
                    <li key={p.id} className="flex gap-3 border-b border-gray-100 pb-4">
                        <Avatar name={p.author.name ?? p.author.username} />
                        <div className="min-w-0">
                        <p className="text-sm text-gray-500">
                            <Link
                                href={`/profile/${p.author.id}`}
                                className="text-base font-bold text-gray-900 hover:text-[#b85c7a]"
                            >
                                <Highlight text={p.author.name ?? p.author.username} query={query} />
                            </Link>{" "}
                            @{p.author.username} · {timeAgo(p.createdAt)} ·{" "}
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                            {p.category}
                            </span>
                        </p>
                        <Link
                            href={`/post/${p.id}?from=explore`}
                            className="mt-1 block text-base hover:text-[#b85c7a]"
                        >
                            <Highlight text={p.content} query={query} />
                        </Link>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCommentOpen((prev) => ({
                                            ...prev,
                                            [p.id]: !prev[p.id],
                                        }))
                                    }
                                    className="transition hover:text-[#b85c7a]"
                                >
                                    💬 {p._count.comments}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleLikePost(p.id)}
                                    disabled={!!likeLoading[p.id]}
                                    className="transition hover:text-[#b85c7a] disabled:opacity-50"
                                >
                                    {likeLoading[p.id] ? "Memproses..." : `♡ ${p._count.likes}`}
                                </button>

                                <span>📊 {p.views}</span>
                            </div>

                            {commentOpen[p.id] && (
                                <div className="mt-3 space-y-3">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleAddComment(p.id);
                                        }}
                                        className="space-y-2"
                                    >
                                        <textarea
                                            value={commentText[p.id] ?? ""}
                                            onChange={(e) =>
                                                setCommentText((prev) => ({
                                                    ...prev,
                                                    [p.id]: e.target.value,
                                                }))
                                            }
                                            placeholder="Tulis komentar..."
                                            rows={2}
                                            disabled={!!commentLoading[p.id]}
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-white/80 p-3 text-sm outline-none focus:border-[#b85c7a] focus:ring-2 focus:ring-pink-100"
                                        />

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={
                                                    !!commentLoading[p.id] ||
                                                    !(commentText[p.id] ?? "").trim()
                                                }
                                                className="rounded-full bg-[#b85c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9e4865] disabled:opacity-50"
                                            >
                                                {commentLoading[p.id] ? "Mengirim..." : "Reply"}
                                            </button>
                                        </div>
                                    </form>

                                    {(newComments[p.id] ?? []).map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                        >
                                            {comment.content}
                                        </div>
                                    ))}
                                </div>
                            )}
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
    <ExploreSidebar/>
    </div>
    </div>
    );
}