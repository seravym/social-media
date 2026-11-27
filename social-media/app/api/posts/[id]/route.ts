import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const currentUserId = await getSessionUserId();

    const post = await prisma.post.findUnique({
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
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Postingan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    let isBookmarked = false;
    if (currentUserId) {
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: currentUserId,
          },
        },
      });
      isBookmarked = Boolean(existingBookmark);
    }

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        views: post.views + 1,
        createdAt: post.createdAt,
        author: post.author,
        repliesCount: post._count.comments,
        likesCount: post._count.likes,
        isLiked: Array.isArray(post.likes) && post.likes.length > 0,
        isBookmarked,
        comments: post.comments,
      },
    });
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail postingan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const userId =
      (await getSessionUserId()) || request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { error: "Postingan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "Tidak memiliki akses untuk menghapus postingan ini" },
        { status: 403 }
      );
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ message: "Postingan berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus postingan" },
      { status: 500 }
    );
  }
}