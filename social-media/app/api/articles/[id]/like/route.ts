
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

const existingLike = await prisma.articleLike.findUnique({
    where: {
    articleId_userId: {
        articleId: id,
        userId,
    },
    },
});

if (existingLike) {
    await prisma.articleLike.delete({
    where: { id: existingLike.id },
    });

    return NextResponse.json({ liked: false });
}

await prisma.articleLike.create({
    data: { articleId: id, userId },
});

return NextResponse.json({ liked: true });
} catch (error) {
return NextResponse.json(
    { error: "Gagal memproses like" },
    { status: 500 }
);
}
}

