// Simpan sebagai: app/api/settings/mute-block/route.ts
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

const USERNAME_RE = /^[a-z0-9_]{1,15}$/;
const MAX_WORD = 50;

export const GET = authed(async (me) => {
  const where = { userId: me.id };
  const orderBy = { createdAt: "desc" as const };
  const [words, muted, blocked] = await Promise.all([
    prisma.mutedWord.findMany({ where, orderBy }),
    prisma.mutedAccount.findMany({ where, orderBy }),
    prisma.blockedAccount.findMany({ where, orderBy }),
  ]);
  return json({
    words: words.map((w) => ({ id: w.id, value: w.word })),
    muted: muted.map((m) => ({ id: m.id, value: m.username })),
    blocked: blocked.map((b) => ({ id: b.id, value: b.username })),
  });
});

// POST { type: "word" | "muted" | "blocked", value }
export const POST = authed(async (me, req) => {
  const body = await req.json().catch(() => null);
  const type = body?.type as string;
  const value = String(body?.value ?? "").trim();

  if (!value) return json({ error: "Isian tidak boleh kosong." }, 400);

  // --- kata yang di-mute ---
  if (type === "word") {
    if (value.length > MAX_WORD)
      return json({ error: `Maksimal ${MAX_WORD} karakter.` }, 400);

    const existing = await prisma.mutedWord.findMany({ where: { userId: me.id } });
    if (existing.some((w) => w.word.toLowerCase() === value.toLowerCase()))
      return json({ error: "Kata itu sudah ada di daftar." }, 409);

    const item = await prisma.mutedWord.create({
      data: { userId: me.id, word: value },
    });
    return json({ id: item.id, value: item.word }, 201);
  }

  // --- akun di-mute / diblokir ---
  if (type === "muted" || type === "blocked") {
    const username = value.replace(/^@/, "").toLowerCase();
    if (!USERNAME_RE.test(username))
      return json({ error: "Username tidak valid (huruf, angka, underscore, maksimal 15)." }, 400);

    const self = await prisma.user.findUnique({
      where: { id: me.id },
      select: { username: true },
    });
    if (self?.username === username)
      return json({ error: "Kamu tidak bisa memilih akunmu sendiri." }, 400);

    if (type === "muted") {
      if (await prisma.blockedAccount.findFirst({ where: { userId: me.id, username } }))
        return json({ error: "Akun ini sudah diblokir." }, 409);
      if (await prisma.mutedAccount.findFirst({ where: { userId: me.id, username } }))
        return json({ error: "Akun ini sudah di-mute." }, 409);

      const item = await prisma.mutedAccount.create({ data: { userId: me.id, username } });
      return json({ id: item.id, value: item.username }, 201);
    }

    // blocked
    if (await prisma.blockedAccount.findFirst({ where: { userId: me.id, username } }))
      return json({ error: "Akun ini sudah diblokir." }, 409);

    // memblokir otomatis menghapus dari daftar mute
    await prisma.mutedAccount.deleteMany({ where: { userId: me.id, username } });
    const item = await prisma.blockedAccount.create({ data: { userId: me.id, username } });
    return json({ id: item.id, value: item.username }, 201);
  }

  return json({ error: "Tipe tidak valid." }, 400);
});

// DELETE ?type=word|muted|blocked&id=...
export const DELETE = authed(async (me, req) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return json({ error: "id wajib diisi." }, 400);

  const where = { id, userId: me.id }; // hanya milik sendiri
  if (type === "word") await prisma.mutedWord.deleteMany({ where });
  else if (type === "muted") await prisma.mutedAccount.deleteMany({ where });
  else if (type === "blocked") await prisma.blockedAccount.deleteMany({ where });
  else return json({ error: "Tipe tidak valid." }, 400);

  return json({ ok: true });
});