import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export const DELETE = authed<Ctx>(async (me, _req, { params }) => {
    const { id, commentId } = await params;

    const comment = await prisma.articleComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.articleId !== id)
        return json({ error: "Komentar tidak ditemukan" }, 404);
    if (comment.userId !== me.id) return json({ error: "Bukan komentarmu" }, 403);

    await prisma.articleComment.delete({ where: { id: commentId } });
    return json({ ok: true });
});