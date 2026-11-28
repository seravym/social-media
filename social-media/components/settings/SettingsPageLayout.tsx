
"use client";

import Link from "next/link";
import {
    Bell,
    Compass,
    Home,
    MessageSquare,
    Settings,
    Users,
} from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    title: string;
    description: string;
    children: ReactNode;
    status?: ReactNode;
};

export default function SettingsPageLayout({
    title,
    description,
    children,
    status,
}: Props) {
    return (
        <div className="bg-dot-canvas min-h-dvh text-slate-900">
        <header className="sticky top-0 z-20 border-b border-white/75 bg-white/75 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
            <Link
                href="/home"
                className="shrink-0 text-sm font-bold tracking-tight text-slate-900"
            >
                Social
            </Link>
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-xs font-medium">
                <Link
                href="/home"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:px-3"
                >
                <Home className="h-3.5 w-3.5" />
                Beranda
                </Link>
                <Link
                href="/explore"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:px-3"
                >
                <Compass className="h-3.5 w-3.5" />
                Jelajahi
                </Link>
                <Link
                href="/conversations"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:px-3"
                >
                <MessageSquare className="h-3.5 w-3.5" />
                Pesan
                </Link>
                <Link
                href="/notifications"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:px-3"
                >
                <Bell className="h-3.5 w-3.5" />
                Notifikasi
                </Link>
                <Link
                href="/communities"
                className="hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:flex sm:px-3"
                >
                <Users className="h-3.5 w-3.5" />
                Komunitas
                </Link>
            </nav>
            <Link
                href="/settings"
                aria-label="Pengaturan"
                className="shrink-0 rounded-lg bg-[#faf0f3] p-1.5 text-[#b85c7a] transition hover:bg-[#f0d5de]"
            >
                <Settings className="h-4 w-4" />
            </Link>
            </div>
        </header>
        <main className="mx-auto max-w-2xl px-3 py-5 sm:px-4">
            <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/75 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                <Link
                    href="/settings"
                    aria-label="Kembali ke pengaturan"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
                >
                    ←
                </Link>
                <div className="min-w-0">
                    <h1 className="text-base font-bold text-slate-900">
                    {title}
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                    {description}
                    </p>
                </div>
                </div>
                {status}
            </div>
            {children}
            </div>
        </main>
        </div>
    );
}
