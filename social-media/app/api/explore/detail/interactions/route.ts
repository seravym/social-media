
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

function getItemType(type: string | null) {
    if (type === "news") return "NEWS" as const;
    if (type === "trending") return "TRENDING" as const;
    return null;
}

async function itemExists(type: "NEWS" | "TRENDING", id: string) {
    if (type === "NEWS") {
        return !!(await prisma.news.findUnique({
            where: { id },
            select: { id: true },
        }));
    }

    return !!(await prisma.trendingTopic.findUnique({
        where: { id },
        select: { id: true },
    }));
}

export const GET = authed(async (me, req) => {
    const { searchParams } = new URL(req.url);
    const type = getItemType(searchParams.get("type"));
    const id = searchParams.get("id");

    if (!type || !id) {
        return json({ error: "Data tidak valid" }, 400);
    }

    if (!(await itemExists(type, id))) {
        return json({ error: "Data tidak ditemukan" }, 404);
    }

    const [likeCount, savedCount, myReactions, comments] =
        await Promise.all([
            prisma.exploreReaction.count({
                where: { type, entityId: id, kind: "LIKE" },
            }),
            prisma.exploreReaction.count({
                where: { type, entityId: id, kind: "SAVED" },
            }),
            prisma.exploreReaction.findMany({
                where: {
                    type,
                    entityId: id,
                    userId: me.id,
                },
                select: { kind: true },
            }),
            prisma.exploreComment.findMany({
                where: { type, entityId: id },
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                },
            }),
        ]);

    return json({
        likeCount,
        savedCount,
        liked: myReactions.some((reaction) => reaction.kind === "LIKE"),
        saved: myReactions.some((reaction) => reaction.kind === "SAVED"),
        comments,
    });
});

export const POST = authed(async (me, req) => {
    const body = await req.json();
    const type = getItemType(body.type);
    const id = typeof body.id === "string" ? body.id : "";
    const action = body.action;

    if (!type || !id) {
        return json({ error: "Data tidak valid" }, 400);
    }
    if (!(await itemExists(type, id))) {
        return json({ error: "Data tidak ditemukan" }, 404);
    }
    if (action === "comment") {
        const content =
            typeof body.content === "string" ? body.content.trim() : "";
        if (!content) {
            return json({ error: "Komentar tidak boleh kosong" }, 400);
        }
        if (content.length > 1000) {
            return json(
                { error: "Komentar maksimal 1000 karakter" },
                400
            );
        }
        const comment = await prisma.exploreComment.create({
            data: {
                type,
                entityId: id,
                userId: me.id,
                content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
        });
        return json({ comment });
    }
    if (action === "like" || action === "saved") {
        const kind = action === "like" ? "LIKE" : "SAVED";
        const existing = await prisma.exploreReaction.findUnique({
            where: {
                type_entityId_kind_userId: {
                    type,
                    entityId: id,
                    kind,
                    userId: me.id,
                },
            },
        });
        if (existing) {
            await prisma.exploreReaction.delete({
                where: { id: existing.id },
            });
            return json({ active: false });
        }
        await prisma.exploreReaction.create({
            data: {
                type,
                entityId: id,
                kind,
                userId: me.id,
            },
        });
        return json({ active: true });
    }
    return json({ error: "Action tidak valid" }, 400);
});
