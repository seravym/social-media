"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applyDisplay, type DisplaySettings } from "@/components/ApplyDisplay";
import { LANGUAGES, t } from "@/lib/i18n";

const DEFAULTS: DisplaySettings = { theme: "light", fontSize: "medium", language: "id" };

export default function DisplaySettingsPage() {
    const [s, setS] = useState<DisplaySettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState<"" | "saved" | "failed">("");

    useEffect(() => {
        (async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
            const data = await res.json();
            setS({ theme: data.theme, fontSize: data.fontSize, language: data.language });
            }
        } finally {
            setLoading(false);
        }
        })();
    }, []);

    async function save(next: DisplaySettings) {
        setS(next);
        applyDisplay(next);
        setNotice("");
        try {
        const res = await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
        });
        setNotice(res.ok ? "saved" : "failed");
        } catch {
        setNotice("failed");
        }
    }

    const lang = s.language;

    const radio = (
        name: keyof DisplaySettings,
        value: string,
        label: string
    ) => (
        <label
        key={value}
        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
        >
        <input
            type="radio"
            name={name}
            checked={s[name] === value}
            onChange={() => save({ ...s, [name]: value })}
            className="accent-pink-600"
        />
        {label}
        </label>
    );

    const card = (title: string, hint: string, children: React.ReactNode) => (
        <section className="mb-4 overflow-hidden rounded-xl border border-gray-200">
        <div className="px-4 pt-3">
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mb-2 text-xs text-gray-500">{hint}</p>
        </div>
        {children}
        </section>
    );

    return (
        <main className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-2 flex items-center gap-3">
            <Link href="/settings" aria-label="Kembali" className="text-xl">
            ←
            </Link>
            <h1 className="text-xl font-bold text-pink-600">{t(lang, "title")}</h1>
        </div>
        <p className="mb-4 text-sm text-gray-500">{t(lang, "subtitle")}</p>

        {loading ? (
            <p className="py-8 text-center text-gray-500">...</p>
        ) : (
            <>
            {card(
                t(lang, "theme"),
                t(lang, "themeHint"),
                <>
                {radio("theme", "light", t(lang, "light"))}
                {radio("theme", "dark", t(lang, "dark"))}
                </>
            )}

            {card(
                t(lang, "fontSize"),
                t(lang, "fontSizeHint"),
                <>
                {radio("fontSize", "small", t(lang, "small"))}
                {radio("fontSize", "medium", t(lang, "medium"))}
                {radio("fontSize", "large", t(lang, "large"))}
                </>
            )}

            {card(
                t(lang, "language"),
                t(lang, "languageHint"),
                <>{LANGUAGES.map((l) => radio("language", l.code, l.label))}</>
            )}

            <section className="mb-4 rounded-xl border border-gray-200 px-4 py-3">
                <h2 className="text-sm font-bold">{t(lang, "preview")}</h2>
                <p className="mt-1 text-sm">{t(lang, "previewText")}</p>
            </section>

            <div className="flex items-center justify-between">
                <span
                className={`text-sm ${notice === "failed" ? "text-red-600" : "text-green-600"}`}
                >
                {notice && t(lang, notice)}
                </span>
                <button
                onClick={() => save(DEFAULTS)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold"
                >
                {t(lang, "reset")}
                </button>
            </div>
            </>
        )}
        </main>
    );
}