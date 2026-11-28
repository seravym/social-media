"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Compass,
  Heart,
  Home,
  MessageCircle,
  MessageSquare,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

type NotificationSettingKey =
  | "notifyLikes"
  | "notifyFollows"
  | "notifyReplies"
  | "notifyToast";

type NotificationSettings = Record<NotificationSettingKey, boolean>;

const DEFAULT_SETTINGS: NotificationSettings = {
  notifyLikes: true,
  notifyFollows: true,
  notifyReplies: true,
  notifyToast: true,
};

const TOGGLE_ITEMS: {
  key: NotificationSettingKey;
  title: string;
  desc: string;
  Icon: typeof Heart;
}[] = [
  {
    key: "notifyLikes",
    title: "Suka",
    desc: "Beri tahu saat seseorang menyukai postinganmu",
    Icon: Heart,
  },
  {
    key: "notifyFollows",
    title: "Pengikut baru",
    desc: "Beri tahu saat ada pengguna yang mulai mengikutimu",
    Icon: UserPlus,
  },
  {
    key: "notifyReplies",
    title: "Balasan dan sebutan",
    desc: "Beri tahu saat seseorang membalas atau menyebut akunmu",
    Icon: MessageCircle,
  },
  {
    key: "notifyToast",
    title: "Pemberitahuan pop-up",
    desc: "Tampilkan notifikasi singkat di pojok layar saat ada aktivitas baru",
    Icon: BellRing,
  },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<
    Partial<Record<NotificationSettingKey, boolean>>
  >({});
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") return;
        setSettings({
          notifyLikes:
            typeof data.notifyLikes === "boolean" ? data.notifyLikes : true,
          notifyFollows:
            typeof data.notifyFollows === "boolean" ? data.notifyFollows : true,
          notifyReplies:
            typeof data.notifyReplies === "boolean" ? data.notifyReplies : true,
          notifyToast:
            typeof data.notifyToast === "boolean" ? data.notifyToast : true,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleToggle = async (key: NotificationSettingKey) => {
    if (savingKeys[key]) return;
    const previous = settings[key];
    const next = !previous;

    setSettings((prev) => ({ ...prev, [key]: next }));
    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    setStatus(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal menyimpan pengaturan.");
      }
      setStatus({ type: "success", text: "Tersimpan" });
    } catch (e) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      setStatus({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal menyimpan pengaturan.",
      });
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
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
          <div className="flex items-center justify-between gap-3 border-b border-white/75 px-5 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                aria-label="Kembali ke pengaturan"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-base font-bold text-slate-900">
                  Notifikasi
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pilih jenis aktivitas yang ingin ditampilkan di notifikasimu.
                </p>
              </div>
            </div>

            {status && (
              <span
                className={`shrink-0 text-xs font-medium ${
                  status.type === "success"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {status.text}
              </span>
            )}
          </div>

          {loading ? (
            <div className="divide-y divide-white/60">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-slate-200/75" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-slate-200/75" />
                      <div className="h-3 w-52 rounded bg-slate-200/60" />
                    </div>
                  </div>
                  <div className="h-6 w-10 rounded-full bg-slate-200/75" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-white/65">
              {TOGGLE_ITEMS.map(({ key, title, desc, Icon }) => {
                const enabled = settings[key];
                const isSaving = Boolean(savingKeys[key]);
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#faf0f3] text-[#b85c7a]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={title}
                      disabled={isSaving}
                      onClick={() => void handleToggle(key)}
                      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-60 ${
                        enabled ? "bg-[#b85c7a]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                          enabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}