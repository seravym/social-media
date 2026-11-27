import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

const MAX_HISTORY = 8;

export const GET = authed(async (me) => {
    const items = await prisma.searchHistory.findMany({
        where: { userId: me.id },
        orderBy: { createdAt: "desc" },
        take: MAX_HISTORY,
        select: { id: true, query: true },
    });
    return json(items);
});

export const POST = authed(async (me, req) => {
    const body = await req.json().catch(() => null);
    const query = String(body?.query ?? "").trim().slice(0, 100);
    if (!query) return json({ error: "Kata pencarian kosong." }, 400);

    const existing = await prisma.searchHistory.findFirst({
        where: { userId: me.id, query },
    });
    if (existing) {
        await prisma.searchHistory.update({
        where: { id: existing.id },
        data: { createdAt: new Date() },
        });
    } else {
        await prisma.searchHistory.create({ data: { userId: me.id, query } });
    }

    const old = await prisma.searchHistory.findMany({
        where: { userId: me.id },
        orderBy: { createdAt: "desc" },
        skip: MAX_HISTORY,
        select: { id: true },
    });
    if (old.length) {
        await prisma.searchHistory.deleteMany({
        where: { id: { in: old.map((o) => o.id) }, userId: me.id },
        });
    }

    return json({ ok: true }, 201);
});

export const DELETE = authed(async (me, req) => {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("all") === "1") {
        await prisma.searchHistory.deleteMany({ where: { userId: me.id } });
        return json({ ok: true });
    }

    const id = searchParams.get("id");
    if (!id) return json({ error: "id wajib diisi." }, 400);
    await prisma.searchHistory.deleteMany({ where: { id, userId: me.id } });
    return json({ ok: true });
});