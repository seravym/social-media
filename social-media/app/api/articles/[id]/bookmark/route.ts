import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

type Ctx = { params: Promise<{ id: string }> };

export const POST = authed<Ctx>(async (me, _req, { params }) => {
    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!article) return json({ error: "Artikel tidak ditemukan" }, 404);

    const existing = await prisma.articleBookmark.findFirst({
        where: { userId: me.id, articleId: id },
    });

    if (existing) {
        await prisma.articleBookmark.deleteMany({ where: { userId: me.id, articleId: id } });
    } else {
        await prisma.articleBookmark.create({ data: { userId: me.id, articleId: id } });
    }

    return json({ saved: !existing });
});