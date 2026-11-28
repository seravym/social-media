"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import SettingsPageLayout from "@/components/settings/SettingsPageLayout";
import { applyDisplay, type DisplaySettings,} from "@/components/ApplyDisplay";
import { LANGUAGES, t } from "@/lib/i18n";

const DEFAULTS: DisplaySettings = {
    theme: "light",
    fontSize: "medium",
    language: "id",
};

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
            setS({
                theme: data.theme,
                fontSize: data.fontSize,
                language: data.language,
            });
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
        className="flex cursor-pointer items-center gap-3 border-t border-white/60 px-4 py-3 text-sm text-slate-700 sm:px-5"
        >
        <input
            type="radio"
            name={name}
            checked={s[name] === value}
            onChange={() =>
            save({ ...s, [name]: value } as DisplaySettings)
            }
            className="accent-[#b85c7a]"
        />
        {label}
        </label>
    );

    const card = (
        title: string,
        hint: string,
        children: ReactNode
    ) => (
        <section className="border-b border-white/65 last:border-b-0">
        <div className="px-4 pt-4 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-900">
            {title}
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-slate-500">
            {hint}
            </p>
        </div>
        {children}
        </section>
    );

    return (
        <SettingsPageLayout
        title={t(lang, "title")}
        description={t(lang, "subtitle")}
        status={
            notice ? (
            <span
                className={`shrink-0 text-xs font-medium ${
                notice === "failed"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
            >
                {t(lang, notice)}
            </span>
            ) : undefined
        }
        >
        {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
            Memuat...
            </p>
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
                <>
                {LANGUAGES.map((l) =>
                    radio("language", l.code, l.label)
                )}
                </>
            )}
            <section className="border-t border-white/65 px-4 py-4 sm:px-5">
                <h2 className="text-sm font-semibold text-slate-900">
                {t(lang, "preview")}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                {t(lang, "previewText")}
                </p>
            </section>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/65 px-4 py-4 sm:px-5">
                <span
                className={`text-xs font-medium ${
                    notice === "failed"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
                >
                {notice && t(lang, notice)}
                </span>
                <button
                type="button"
                onClick={() => save(DEFAULTS)}
                className="rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                {t(lang, "reset")}
                </button>
            </div>
            </>
        )}
        </SettingsPageLayout>
    );
}
