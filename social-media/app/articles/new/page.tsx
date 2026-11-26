"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Technology", "Design", "Data", "Food", "Travel"];
const MIN_TITLE = 5;
const MIN_CONTENT = 80;

export default function NewArticlePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        setError("");

        if (title.trim().length < MIN_TITLE) {
        setError(`Judul minimal ${MIN_TITLE} karakter.`);
        return;
        }
        if (content.trim().length < MIN_CONTENT) {
        setError(`Isi minimal ${MIN_CONTENT} karakter.`);
        return;
        }

        setSubmitting(true);
        try {
        const res = await fetch("/api/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, category, content }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? "Gagal menerbitkan artikel.");
            return;
        }
        router.push(`/articles/${data.id}`);
        } catch {
        setError("Tidak bisa terhubung ke server.");
        } finally {
        setSubmitting(false);
        }
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
            <Link href="/articles" aria-label="Kembali" className="text-xl">
            ←
            </Link>
            <h1 className="text-xl font-bold text-pink-600">New Articles</h1>
        </div>

        <label className="block text-sm font-semibold">Title</label>
        <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul artikel Anda"
            className="mb-4 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
        />

        <label className="block text-sm font-semibold">Category</label>
        <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-4 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
        >
            {CATEGORIES.map((c) => (
            <option key={c} value={c}>
                {c}
            </option>
            ))}
        </select>

        <label className="block text-sm font-semibold">Write here.</label>
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Tulis artikel Anda di sini. Pisahkan paragraf dengan satu baris kosong."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
        />
        <p
            className={`mt-1 text-right text-xs ${
            content.trim().length < MIN_CONTENT ? "text-gray-500" : "text-green-600"
            }`}
        >
            {content.trim().length} karakter (minimal {MIN_CONTENT})
        </p>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
            <Link
            href="/articles"
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
            Batal
            </Link>
            <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
            >
            {submitting ? "Menerbitkan..." : "Terbitkan"}
            </button>
        </div>
        </main>
    );
}