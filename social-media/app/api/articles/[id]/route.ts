
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
    params: Promise<{ id: string }>;
};

export async function GET(
request: NextRequest,
{ params }: Context
) {
try {
const { id } = await params;

const article = await prisma.article.findUnique({
    where: { id },
    include: {
    author: {
        select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        },
    },
    comments: {
        include: {
        user: {
            select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            },
        },
        },
        orderBy: { createdAt: "asc" },
    },
    _count: {
        select: { likes: true, comments: true },
    },
    },
});

if (!article) {
    return NextResponse.json(
    { error: "Artikel tidak ditemukan" },
    { status: 404 }
    );
}

return NextResponse.json(article);
} catch (error) {
return NextResponse.json(
    { error: "Gagal mengambil detail artikel" },
    { status: 500 }
);
}
}

export async function PATCH(
request: NextRequest,
{ params }: Context
) {
try {
const { id } = await params;
const { title, content, coverImageUrl, userId } =
    await request.json();

const article = await prisma.article.findUnique({
    where: { id },
});

if (!article) {
    return NextResponse.json(
    { error: "Artikel tidak ditemukan" },
    { status: 404 }
    );
}

if (!userId || article.authorId !== userId) {
    return NextResponse.json(
    { error: "Tidak memiliki akses" },
    { status: 403 }
    );
}

const updated = await prisma.article.update({
    where: { id },
    data: {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(coverImageUrl !== undefined && { coverImageUrl }),
    },
});

return NextResponse.json(updated);
} catch (error) {
return NextResponse.json(
    { error: "Gagal mengubah artikel" },
    { status: 500 }
);
}
}

export async function DELETE(
request: NextRequest,
{ params }: Context
) {
try {
const { id } = await params;
const userId = request.nextUrl.searchParams.get("userId");

const article = await prisma.article.findUnique({
    where: { id },
});

if (!article) {
    return NextResponse.json(
    { error: "Artikel tidak ditemukan" },
    { status: 404 }
    );
}

if (!userId || article.authorId !== userId) {
    return NextResponse.json(
    { error: "Tidak memiliki akses" },
    { status: 403 }
    );
}

await prisma.article.delete({ where: { id } });

return NextResponse.json({ message: "Artikel berhasil dihapus" });
} catch (error) {
return NextResponse.json(
    { error: "Gagal menghapus artikel" },
    { status: 500 }
);
}
}
