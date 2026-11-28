"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const CATEGORIES = ["Technology", "Design", "Data", "Food", "Travel"];
const MIN_TITLE = 5;
const MIN_CONTENT = 80;

const inputCls =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-base outline-none transition focus:border-[#b85c7a] focus:ring-2 focus:ring-pink-200";

export default function NewArticlePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
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
            body: JSON.stringify({
                title,
                category,
                content,
                coverImageUrl: imageUrl.trim() || null,
            }),
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
    <div className="bg-dot-canvas min-h-dvh text-slate-900">
        <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4">
            <div className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
            <Link href="/articles" aria-label="Kembali" className="text-xl text-[#b85c7a] hover:text-[#9e4865]">
            ←
            </Link>
            <h1 className="text-2xl font-bold text-[#b85c7a]">New Articles</h1>
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

        <label className="block text-base font-semibold">
            Cover Image URL
        </label>
        <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={`${inputCls} mb-4`}
        />
        {imageUrl.trim() && (
            <div className="mb-6">
                <p className="mb-2 text-sm text-gray-500">
                    Preview gambar
                </p>
                <Image
                    src={imageUrl}
                    alt="Preview cover artikel"
                    width={800}
                    height={400}
                    unoptimized
                    className="h-48 w-full rounded-xl object-cover"
                />
            </div>
        )}

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
            className="rounded-full bg-[#b85c7a] px-6 py-2.5 text-base font-semibold text-white transition hover:bg-[#9e4865] disabled:opacity-60"
            >
            {submitting ? "Menerbitkan..." : "Terbitkan"}
            </button>
        </div>
        </div>
        </main>
    </div>
    );
}