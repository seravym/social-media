"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Technology", "Design", "Data", "Food", "Travel"];
const MIN_TITLE = 5;
const MIN_CONTENT = 80;

const inputCls =
    "mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200";

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
        <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
            <Link href="/articles" aria-label="Kembali" className="text-2xl">
            ←
            </Link>
            <h1 className="text-2xl font-bold text-pink-600">New Articles</h1>
        </div>

        <label className="block text-base font-semibold">Title</label>
        <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul artikel Anda"
            className={`${inputCls} mb-6`}
        />

        <label className="block text-base font-semibold">Category</label>
        <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputCls} mb-6`}
        >
            {CATEGORIES.map((c) => (
            <option key={c} value={c}>
                {c}
            </option>
            ))}
        </select>

        <label className="block text-base font-semibold">Write here.</label>
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Tulis artikel Anda di sini. Pisahkan paragraf dengan satu baris kosong."
            className={inputCls}
        />
        <p
            className={`mt-2 text-right text-sm ${
            content.trim().length < MIN_CONTENT ? "text-gray-500" : "text-green-600"
            }`}
        >
            {content.trim().length} karakter (minimal {MIN_CONTENT})
        </p>

        {error && <p className="mt-3 text-base text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
            <Link
            href="/articles"
            className="rounded-full border border-gray-300 px-6 py-2.5 text-base font-semibold"
            >
            Batal
            </Link>
            <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-pink-600 px-6 py-2.5 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
            >
            {submitting ? "Menerbitkan..." : "Terbitkan"}
            </button>
        </div>
        </main>
    );
}