
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (bookmarks.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const posts = await prisma.post.findMany({
      where: {
        id: {
          in: bookmarks.map((bookmark) => bookmark.postId),
        },
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
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    const postsMap = new Map<string, (typeof posts)[number]>();

    posts.forEach((post) => {
      postsMap.set(post.id, post);
    });

    const formatted = bookmarks.flatMap((bookmark) => {
      const post = postsMap.get(bookmark.postId);

      if (!post) return [];

      return [
        {
          id: post.id,
          content: post.content,
          views: post.views,
          createdAt: post.createdAt,
          author: post.author,
          repliesCount: post._count.comments,
          likesCount: post._count.likes,
          isLiked: post.likes.length > 0,
          isBookmarked: true,
          bookmarkedAt: bookmark.createdAt,
        },
      ];
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET Bookmarks Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, message: "Post ID and User ID are required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      update: {},
      create: {
        postId,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Post bookmarked successfully",
        data: bookmark,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Bookmark Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to bookmark post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get("postId");
    const userId = request.nextUrl.searchParams.get("userId");

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, message: "Post ID and User ID are required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.bookmark.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "Bookmark not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("DELETE Bookmark Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}
