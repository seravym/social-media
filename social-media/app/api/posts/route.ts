import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const tab = request.nextUrl.searchParams.get("tab") || "foryou";
    const currentUserId = await getSessionUserId();

    let whereClause = {};

    // Filter khusus tab "following"
    if (tab === "following") {
      if (!currentUserId) {
        return NextResponse.json({ posts: [] });
      }
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = follows.map((f) => f.followingId);
      whereClause = { authorId: { in: followingIds } };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
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
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Cek status bookmark dari tabel Bookmark yang sudah ada
    let bookmarkedIds = new Set<string>();
    if (currentUserId && posts.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map((p) => p.id) },
        },
        select: { postId: true },
      });
      bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
    }

    const formatted = posts.map((p) => ({
      id: p.id,
      content: p.content,
      views: p.views,
      createdAt: p.createdAt,
      author: p.author,
      repliesCount: p._count.comments,
      likesCount: p._count.likes,
      isLiked: Array.isArray(p.likes) && p.likes.length > 0,
      isBookmarked: bookmarkedIds.has(p.id),
    }));

    return NextResponse.json({ posts: formatted });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil postingan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = body.content ?? body.message;
    // Pakai user dari session, atau fallback ke body.userId saat testing di EchoAPI
    const userId = (await getSessionUserId()) || body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Isi postingan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        post: {
          id: newPost.id,
          content: newPost.content,
          views: newPost.views,
          createdAt: newPost.createdAt,
          author: newPost.author,
          repliesCount: 0,
          likesCount: 0,
          isLiked: false,
          isBookmarked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Gagal membuat postingan" },
      { status: 500 }
    );
  }
}