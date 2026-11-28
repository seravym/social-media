"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Compass,
  Home,
  MessageSquare,
  Palette,
  Settings,
  Shield,
  User,
  Users,
  VolumeX,
} from "lucide-react";

type WhoCanMessage = "everyone" | "following" | "none";

const MENU = [
  {
    href: "/settings/account",
    title: "Informasi akun",
    desc: "Nama, username, email, bio, dan nomor telepon",
    Icon: User,
  },
  {
    href: "/settings/audience",
    title: "Audiens dan penandaan",
    desc: "Siapa yang bisa melihat, membalas, dan menandai kamu",
    Icon: Shield,
  },
  {
    href: "/settings/mute-block",
    title: "Mute dan blokir",
    desc: "Kata, akun yang di-mute, dan akun yang diblokir",
    Icon: VolumeX,
  },
  {
    href: "/settings/display",
    title: "Tampilan dan bahasa",
    desc: "Tema, ukuran huruf, dan bahasa aplikasi",
    Icon: Palette,
  },
  {
    href: "/settings/notifications",
    title: "Notifikasi",
    desc: "Atur notifikasi apa saja yang ingin kamu terima",
    Icon: Bell,
  },
];

const MESSAGE_OPTIONS: { value: WhoCanMessage; label: string }[] = [
  { value: "everyone", label: "Semua orang" },
  { value: "following", label: "Yang diikuti" },
  { value: "none", label: "Tidak ada" },
];

export default function SettingsPage() {
  const [whoCanMessage, setWhoCanMessage] = useState<WhoCanMessage>("everyone");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data?.whoCanMessage === "everyone" ||
          data?.whoCanMessage === "following" ||
          data?.whoCanMessage === "none"
        ) {
          setWhoCanMessage(data.whoCanMessage);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleMessagePolicyChange = async (next: WhoCanMessage) => {
    if (saving || next === whoCanMessage) return;
    const previous = whoCanMessage;
    setWhoCanMessage(next);
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whoCanMessage: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal menyimpan pengaturan.");
      }
      setStatus({ type: "success", text: "Tersimpan" });
    } catch (e) {
      setWhoCanMessage(previous);
      setStatus({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal menyimpan pengaturan.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-dot-canvas min-h-dvh text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/75 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <Link
            href="/home"
            className="text-sm font-bold tracking-tight text-slate-900"
          >
            Social
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
            <Link
              href="/home"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <Home className="h-3.5 w-3.5" />
              Beranda
            </Link>
            <Link
              href="/explore"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <Compass className="h-3.5 w-3.5" />
              Jelajahi
            </Link>
            <Link
              href="/conversations"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Pesan
            </Link>
            <Link
              href="/notifications"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
            >
              <Bell className="h-3.5 w-3.5" />
              Notifikasi
            </Link>
            <Link
              href="/communities"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 sm:flex"
            >
              <Users className="h-3.5 w-3.5" />
              Komunitas
            </Link>
          </nav>

          <Link
            href="/settings"
            aria-label="Pengaturan"
            className="rounded-lg bg-[#faf0f3] p-1.5 text-[#b85c7a] transition"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 py-5 sm:px-4">
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="border-b border-white/75 px-5 py-4">
            <h1 className="text-base font-bold text-slate-900">Pengaturan</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Kelola informasi akun, privasi, dan preferensi aplikasimu.
            </p>
          </div>

          <ul className="divide-y divide-white/65">
            {MENU.map(({ href, title, desc, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-white/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#faf0f3] text-[#b85c7a]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}

            <li className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#faf0f3] text-[#b85c7a]">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Privasi pesan langsung
                      </p>
                      {status && (
                        <span
                          className={`text-[11px] font-medium ${
                            status.type === "success"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {status.text}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Siapa yang boleh mengirim pesan kepadamu
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/70" />
                ) : (
                  <div className="inline-flex shrink-0 rounded-lg bg-slate-100/80 p-0.5">
                    {MESSAGE_OPTIONS.map((opt) => {
                      const active = whoCanMessage === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={saving}
                          onClick={() => void handleMessagePolicyChange(opt.value)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                            active
                              ? "bg-white font-semibold text-[#9e4865] shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}