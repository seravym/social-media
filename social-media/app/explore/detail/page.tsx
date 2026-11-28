"use client";

import { Suspense, useEffect, useState } from "react";
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

function formatCount(n: number) {
    return n >= 1000
        ? `${(n / 1000).toFixed(1).replace(".", ",")} rb postingan`
        : `${n} postingan`;
}

function DetailContent() {
    const searchParams = useSearchParams();

    const type = searchParams.get("type");
    const id = searchParams.get("id");
    
    const [item, setItem] = useState<NewsDetail | TrendingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || (type !== "news" && type !== "trending")) {
            return;
        }

        const detailId = id;
        let cancelled = false;
        async function loadDetail() {
            try {
                const res = await fetch(
                    `/api/explore/detail?type=${type}&id=${encodeURIComponent(detailId)}`
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
    }, [type, id]);

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
                    {!loading && (!id || (type !== "news" && type !== "trending")) && (
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