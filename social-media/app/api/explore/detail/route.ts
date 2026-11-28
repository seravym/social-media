import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

export const GET = authed(async (_me, req) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    if (!id || (type !== "news" && type !== "trending")) {
        return json({ error: "Data tidak valid" }, 400);
    }
    if (type === "news") {
        const item = await prisma.news.findUnique({
            where: { id },
        });
        if (!item) {
            return json({ error: "Berita tidak ditemukan" }, 404);
        }
        return json({ item });
    }
    const item = await prisma.trendingTopic.findUnique({
        where: { id },
    });
    if (!item) {
        return json({ error: "Topik trending tidak ditemukan" }, 404);
    }
    return json({ item });
});