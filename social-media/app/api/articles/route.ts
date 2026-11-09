
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET ARTICLES ERROR:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

    export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, coverImageUrl, userId } = body;

        if (!title || !content || !userId) {
        return NextResponse.json(
            { error: "Title, content, dan userId wajib diisi" },
            { status: 400 }
        );
        }

        const user = await prisma.user.findUnique({
        where: { id: userId },
        });

        if (!user) {
        return NextResponse.json(
            { error: "User tidak ditemukan" },
            { status: 404 }
        );
        }

        const article = await prisma.article.create({
        data: {
            title,
            content,
            coverImageUrl: coverImageUrl || null,
            authorId: userId,
            status: "published",
            publishedAt: new Date(),
        },
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        return NextResponse.json(
        { error: "Gagal membuat artikel" },
        { status: 500 }
        );
    }
}
