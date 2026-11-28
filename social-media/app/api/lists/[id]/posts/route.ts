
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const currentUserId =
      (await getSessionUserId()) ||
      process.env.NEXT_PUBLIC_TEST_USER_ID ||
      null;

    const { id } = await params;
    const listId = Number(id);

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid List ID" },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    const isOwner = list.ownerId === currentUserId;
    const isMember = list.members.some(
      (member) => member.userId === currentUserId
    );

    if (list.isPrivate && !isOwner && !isMember) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to view this List" },
        { status: 403 }
      );
    }

    const memberIds = list.members.map(
      (member) => member.userId
    );

    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: memberIds,
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
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let bookmarkedIds = new Set<string>();

    if (currentUserId && posts.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: {
            in: posts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      });

      bookmarkedIds = new Set(
        bookmarks.map((bookmark) => bookmark.postId)
      );
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      views: post.views,
      createdAt: post.createdAt,
      author: post.author,
      repliesCount: post._count.comments,
      likesCount: post._count.likes,
      isLiked:
        Array.isArray(post.likes) && post.likes.length > 0,
      isBookmarked: bookmarkedIds.has(post.id),
    }));

    return NextResponse.json({
      success: true,
      list: {
        id: list.id,
        name: list.name,
      },
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("GET List Timeline Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch List Timeline" },
      { status: 500 }
    );
  }
}
