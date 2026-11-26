import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authed<Ctx>(async (me, _req, { params }) => {
    const { id } = await params;

    const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return json({ error: "Artikel tidak ditemukan" }, 404);

    const article = await prisma.article.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: me.id }, select: { userId: true } },
        bookmarks: { where: { userId: me.id }, select: { userId: true } },
        },
    });

    const { likes, bookmarks, _count, ...a } = article;
    return json({
        ...a,
        likeCount: _count.likes,
        commentCount: _count.comments,
        liked: likes.length > 0,
        saved: bookmarks.length > 0,
    });
});

export const DELETE = authed<Ctx>(async (me, _req, { params }) => {
    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return json({ error: "Artikel tidak ditemukan" }, 404);
    if (article.authorId !== me.id) return json({ error: "Bukan artikelmu" }, 403);

    await prisma.article.delete({ where: { id } });
    return json({ ok: true });
});