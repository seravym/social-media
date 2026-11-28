"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, UserPlus } from "lucide-react";

type Trend = {
    id: string;
    name: string;
    category?: string | null;
    postCount: number;
};

type Account = {
    id: string;
    name: string | null;
    username: string;
};

export default function ExploreSidebar() {
    const [trending, setTrending] = useState<Trend[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/explore", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
            if (data?.trending) {
            setTrending(data.trending.slice(0, 5));
            }
            if (data?.accounts) {
            setAccounts(data.accounts.slice(0, 3));
            }
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, []);
    return (
        <aside className="hidden lg:block">
        <div className="sticky top-16 space-y-4">
            <section className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/75 px-4 py-3">
                <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#b85c7a]" />
                <h2 className="text-xs font-semibold text-slate-900">
                    Trending
                </h2>
                </div>
                <Link
                href="/explore"
                className="text-[11px] font-medium text-[#b85c7a]"
                >
                Lihat semua
                </Link>
            </div>
            {loading ? (
                <p className="px-4 py-5 text-xs text-slate-400">
                Memuat...
                </p>
            ) : trending.length === 0 ? (
                <p className="px-4 py-5 text-xs text-slate-400">
                Belum ada topik trending.
                </p>
            ) : (
                <ul className="divide-y divide-white/65">
                {trending.map((topic) => (
                    <li key={topic.id}>
                    <Link
                        href={`/explore?q=${encodeURIComponent(topic.name)}`}
                        className="block px-4 py-3 transition hover:bg-white/60"
                    >
                        <p className="truncate text-xs font-semibold text-slate-800">
                        {topic.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                        {topic.category
                            ? `${topic.category} · `
                            : ""}
                        {topic.postCount} postingan
                        </p>
                    </Link>
                    </li>
                ))}
                </ul>
            )}
            </section>
            <section className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/75 px-4 py-3">
                <UserPlus className="h-3.5 w-3.5 text-[#b85c7a]" />
                <h2 className="text-xs font-semibold text-slate-900">
                Mungkin kamu kenal
                </h2>
            </div>
            {loading ? (
                <p className="px-4 py-5 text-xs text-slate-400">
                Memuat...
                </p>
            ) : accounts.length === 0 ? (
                <p className="px-4 py-5 text-xs text-slate-400">
                Belum ada rekomendasi akun.
                </p>
            ) : (
                <ul className="divide-y divide-white/65">
                {accounts.map((account) => {
                    const display =
                    account.name?.trim() || account.username;
                    return (
                    <li key={account.id}>
                        <Link
                        href={`/profile/${account.id}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-white/60"
                        >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#faf0f3] text-xs font-semibold text-[#b85c7a]">
                            {display.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                            {display}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                            @{account.username}
                            </p>
                        </div>
                        </Link>
                    </li>
                    );
                })}
                </ul>
            )}
            </section>
        </div>
        </aside>
    );
}