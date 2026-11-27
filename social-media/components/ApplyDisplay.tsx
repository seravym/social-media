"use client";

import { useEffect } from "react";

export type DisplaySettings = {
    theme: string;
    fontSize: string;
    language: string;
};

const FONT_PX: Record<string, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
};

export function applyDisplay(s: DisplaySettings) {
    const root = document.documentElement;
    root.setAttribute("data-theme", s.theme === "dark" ? "dark" : "light");
    root.style.fontSize = FONT_PX[s.fontSize] ?? FONT_PX.medium;
    root.lang = s.language || "id";
}

export default function ApplyDisplay() {
    useEffect(() => {
        (async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) applyDisplay(await res.json());
        } catch {}
        })();
    }, []);

    return null;
}