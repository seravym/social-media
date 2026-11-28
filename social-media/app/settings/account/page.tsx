"use client";

import { useEffect, useState } from "react";
import SettingsPageLayout from "@/components/settings/SettingsPageLayout";

type Form = {
    name: string;
    username: string;
    email: string;
    phone: string;
    birthDate: string;
    bio: string;
};

const EMPTY: Form = {
    name: "",
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    bio: "",
};

const MAX_BIO = 160;

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#b85c7a] focus:ring-2 focus:ring-[#f0d5de]";

export default function AccountSettingsPage() {
    const [form, setForm] = useState<Form>(EMPTY);
    const [saved, setSaved] = useState<Form>(EMPTY);
    const [errors, setErrors] = useState<
        Partial<Record<keyof Form, string>>
    >({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        (async () => {
        try {
            const res = await fetch("/api/settings/account");
            
            if (res.ok) {
            const data: Form = await res.json();
            setForm(data);
            setSaved(data);
            } else {
            setMessage("Gagal memuat data akun.");
            }
        } catch {
            setMessage("Tidak bisa terhubung ke server.");
        } finally {
            setLoading(false);
        }
        })();
    }, []);

    function update(field: keyof Form, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
        setMessage("");
    }

    async function handleSave() {
        setSaving(true);
        setMessage("");

        try {
        const res = await fetch("/api/settings/account", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            setErrors(data.errors ?? {});
            if (!data.errors) {
            setMessage(data.error ?? "Gagal menyimpan.");
            }
            return;
        }
        setErrors({});
        setSaved(form);
        setMessage("Perubahan berhasil disimpan.");
        } catch {
        setMessage("Tidak bisa terhubung ke server.");
        } finally {
        setSaving(false);
        }
    }
    function handleCancel() {
        setForm(saved);
        setErrors({});
        setMessage("");
    }
    const field = (
        label: string,
        key: keyof Form,
        type = "text"
    ) => (
        <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-900">
            {label}
        </label>
        <input
            type={type}
            value={form[key]}
            onChange={(e) => update(key, e.target.value)}
            className={inputCls}
        />
        {errors[key] && (
            <p className="mt-1 text-xs text-rose-600">
            {errors[key]}
            </p>
        )}
        </div>
    );
    return (
        <SettingsPageLayout
        title="Informasi akun"
        description="Kelola informasi dasar akun Anda."
        >
        {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
            Memuat...
            </p>
        ) : (
            <div className="px-4 py-4 sm:px-5">
            {field("Nama", "name")}
            {field("Username", "username")}
            {field("Email", "email", "email")}
            {field("Nomor telepon", "phone", "tel")}
            {field("Tanggal lahir", "birthDate", "date")}
            <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-900">
                Bio
                </label>
                <textarea
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={3}
                className={inputCls}
                />
                <div className="mt-1 flex justify-between gap-2 text-xs">
                <span className="text-rose-600">
                    {errors.bio}
                </span>
                <span
                    className={
                    form.bio.length > MAX_BIO
                        ? "text-rose-600"
                        : "text-slate-500"
                    }
                >
                    {form.bio.length}/{MAX_BIO}
                </span>
                </div>
            </div>
            {message && (
                <p
                className={`mb-3 text-sm ${
                    message.startsWith("Perubahan")
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
                >
                {message}
                </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/65 pt-4">
                <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                Batalkan
                </button>
                <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-[#b85c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9e4865] disabled:opacity-60"
                >
                {saving ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
            </div>
        )}
        </SettingsPageLayout>
    );
}
