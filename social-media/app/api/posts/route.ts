import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { resolveUserId } from "@/lib/route";
import {
  getModerationFilters,
  isMutedAuthor,
  isMutedContent,
} from "@/lib/moderation";
import type { Prisma } from "@/generated/client";

export async function GET(request: NextRequest) {
  try {
    const tab = request.nextUrl.searchParams.get("tab") || "foryou";
    const currentUserId = await getSessionUserId();
    const filters = await getModerationFilters(currentUserId);

    let followingIds: string[] = [];
    if (currentUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      followingIds = follows.map((f) => f.followingId);
    }
    const followingSet = new Set(followingIds);

    let whereClause: Prisma.PostWhereInput = {};

    if (tab === "following") {
      if (!currentUserId) {
        return NextResponse.json({ posts: [] });
      }

      whereClause = {
        authorId: { in: followingIds },
      };
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
            settings: { select: { protectPosts: true } },
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

    const visiblePosts = posts.filter((post) => {
      if (isMutedAuthor(post.author.username, filters)) return false;
      if (isMutedContent(post.content, filters.words)) return false;
      if (!post.author.settings?.protectPosts) return true;
      if (currentUserId && post.authorId === currentUserId) return true;
      return Boolean(currentUserId && followingSet.has(post.authorId));
    });

    let bookmarkedIds = new Set<string>();

    if (currentUserId && visiblePosts.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: { in: visiblePosts.map((p) => p.id) },
        },
        select: { postId: true },
      });

      bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
    }

    const formatted = visiblePosts.map((p) => ({
      id: p.id,
      content: p.content,
      views: p.views,
      createdAt: p.createdAt,
      author: {
        id: p.author.id,
        name: p.author.name,
        username: p.author.username,
        avatarUrl: p.author.avatarUrl,
      },
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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const content = body.content ?? body.message;
    const userId = await resolveUserId(body.userId);

    const communityId =
      body.communityId !== undefined &&
      body.communityId !== null &&
      body.communityId !== ""
        ? Number(body.communityId)
        : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Isi postingan tidak boleh kosong" },
        { status: 400 },
      );
    }

    if (communityId !== null) {
      if (!Number.isInteger(communityId) || communityId <= 0) {
        return NextResponse.json(
          { error: "Community ID tidak valid" },
          { status: 400 },
        );
      }

      const community = await prisma.community.findUnique({
        where: { id: communityId },
      });

      if (!community) {
        return NextResponse.json(
          { error: "Community tidak ditemukan" },
          { status: 404 },
        );
      }

      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Join community terlebih dahulu untuk membuat post" },
          { status: 403 },
        );
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId,
        ...(communityId !== null ? { communityId } : {}),
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
        success: true,
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
          communityId: newPost.communityId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);

    return NextResponse.json(
      { error: "Gagal membuat postingan" },
      { status: 500 },
    );
  }
}