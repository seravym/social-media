import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,15}$/;

const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export const GET = authed(async (me) => {
    const user = await prisma.user.findUnique({
        where: { id: me.id },
        select: {
        name: true,
        username: true,
        email: true,
        phone: true,
        birthDate: true,
        bio: true,
        },
    });
    if (!user) return json({ error: "User tidak ditemukan" }, 404);

    return json({
        name: user.name ?? "",
        username: user.username,
        email: user.email,
        phone: user.phone ?? "",
        birthDate: toDateInput(user.birthDate),
        bio: user.bio ?? "",
    });
});

export const PUT = authed(async (me, req) => {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Data tidak valid" }, 400);

    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phoneRaw = String(body.phone ?? "").trim();
    const birthDateRaw = String(body.birthDate ?? "").trim();
    const bio = String(body.bio ?? "").trim();

    const errors: Record<string, string> = {};

    if (!name) errors.name = "Nama wajib diisi.";
    else if (name.length > 50) errors.name = "Nama maksimal 50 karakter.";

    if (!USERNAME_RE.test(username))
        errors.username = "Username 3-15 karakter: huruf, angka, atau underscore.";

    if (!EMAIL_RE.test(email)) errors.email = "Format email tidak valid.";

    const phoneDigits = phoneRaw.replace(/[\s+\-()]/g, "");
    if (phoneRaw && !/^\d{8,15}$/.test(phoneDigits))
        errors.phone = "Nomor telepon harus 8-15 digit angka.";

    let birthDate: Date | null = null;
    if (birthDateRaw) {
        birthDate = new Date(birthDateRaw);
        if (Number.isNaN(birthDate.getTime())) errors.birthDate = "Tanggal lahir tidak valid.";
        else if (birthDate > new Date()) errors.birthDate = "Tanggal lahir tidak boleh di masa depan.";
    }

    if (bio.length > 160) errors.bio = "Bio maksimal 160 karakter.";

    if (!errors.username) {
        const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: me.id } },
        select: { id: true },
        });
        if (taken) errors.username = "Username sudah dipakai.";
    }
    if (!errors.email) {
        const taken = await prisma.user.findFirst({
        where: { email, NOT: { id: me.id } },
        select: { id: true },
        });
        if (taken) errors.email = "Email sudah dipakai.";
    }

    if (Object.keys(errors).length > 0) return json({ errors }, 400);

    await prisma.user.update({
        where: { id: me.id },
        data: {
        name,
        username,
        email,
        phone: phoneRaw ? phoneRaw : null,
        birthDate,
        bio: bio || null,
        },
    });

    return json({ ok: true });
});