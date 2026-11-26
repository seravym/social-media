import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

type Ctx = { params: Promise<{ id: string }> };
const MAX_COMMENT = 500;

export const GET = authed<Ctx>(async (me, _req, { params }) => {
    const { id } = await params;

    const comments = await prisma.articleComment.findMany({
        where: { articleId: id },
        orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return json(
        comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: byId.get(c.userId) ?? null,
        isOwner: c.userId === me.id,
        }))
    );
    });

    export const POST = authed<Ctx>(async (me, req, { params }) => {
    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!article) return json({ error: "Artikel tidak ditemukan" }, 404);

    const body = await req.json().catch(() => null);
    const content = String(body?.content ?? "").trim();

    if (!content) return json({ error: "Komentar tidak boleh kosong." }, 400);
    if (content.length > MAX_COMMENT)
        return json({ error: `Komentar maksimal ${MAX_COMMENT} karakter.` }, 400);

    const comment = await prisma.articleComment.create({
        data: { articleId: id, userId: me.id, content },
    });
    return json(comment, 201);
});