import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

export const GET = authed(async (me, req) => {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    const words = q.split(/\s+/).filter(Boolean);

    const textFilter = (fields: string[]) =>
        words.map((w) => ({
            OR: fields.map((f) => ({
                [f]: {
                    contains: w,
                    mode: "insensitive" as const,
                },
            })),
        }));

    const [news, trending, posts] = await Promise.all([
        prisma.news.findMany({
            where: { AND: textFilter(["title", "summary"]) },
            orderBy: { createdAt: "desc" },
        }),

        prisma.trendingTopic.findMany({
            where: { AND: textFilter(["name"]) },
            orderBy: { postCount: "desc" },
        }),

        prisma.explorePost.findMany({
            where: { AND: textFilter(["content"]) },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
    ]);

    const accounts = await prisma.user.findMany({
        where: {
            id: { not: me.id },
            ...(words.length
                ? { AND: textFilter(["username", "name"]) }
                : {}),
        },
        select: {
            id: true,
            name: true,
            username: true,
        },
        orderBy: { createdAt: "desc" },
        take: words.length ? 10 : 3,
    });

    return json({ news, trending, posts, accounts });
});
