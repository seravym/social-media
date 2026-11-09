
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
    params: Promise<{ id: string }>;
};

export async function POST(
request: NextRequest,
{ params }: Context
) {
try {
const { id } = await params;
const { userId } = await request.json();

if (!userId) {
    return NextResponse.json(
    { error: "userId wajib diisi" },
    { status: 400 }
    );
}

const article = await prisma.article.findUnique({
    where: { id },
});

if (!article) {
    return NextResponse.json(
    { error: "Artikel tidak ditemukan" },
    { status: 404 }
    );
}

const existing = await prisma.articleBookmark.findUnique({
    where: {
    articleId_userId: {
        articleId: id,
        userId,
    },
    },
});

if (existing) {
    await prisma.articleBookmark.delete({
    where: { id: existing.id },
    });

    return NextResponse.json({ bookmarked: false });
}

await prisma.articleBookmark.create({
    data: { articleId: id, userId },
});

return NextResponse.json({ bookmarked: true });
} catch (error) {
return NextResponse.json(
    { error: "Gagal memproses bookmark" },
    { status: 500 }
);
}
}
