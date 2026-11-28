import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const userId = (await getSessionUserId()) || body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Postingan tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });

      return NextResponse.json({
        bookmarked: false,
      });
    }

    await prisma.bookmark.create({
      data: {
        postId: id,
        userId,
      },
    });

    return NextResponse.json({
      bookmarked: true,
    });
  } catch (error) {
    console.error("POST /api/posts/[id]/bookmark error:", error);

    return NextResponse.json(
      { error: "Gagal memproses bookmark" },
      { status: 500 }
    );
  }
}