import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { resolveUserId } from "@/lib/route";
import { notifyUser } from "@/lib/notify";
import {
  getModerationFilters,
  isMutedAuthor,
  isMutedContent,
} from "@/lib/moderation";

type Context = {
  params: Promise<{ id: string }>;
};

const MENTION_RE = /@([a-zA-Z0-9_]{1,15})/g;

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const currentUserId = await getSessionUserId();
    const filters = await getModerationFilters(currentUserId);

    const comments = await prisma.postComment.findMany({
      where: { postId: id },
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
    });

    const visible = comments.filter(
      (comment) =>
        comment.userId === currentUserId ||
        (!isMutedAuthor(comment.user.username, filters) &&
          !isMutedContent(comment.content, filters.words)),
    );

    return NextResponse.json({ comments: visible });
  } catch (error) {
    console.error("GET /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil komentar" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const content = body.content ?? body.message;
    const userId = await resolveUserId(body.userId);

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Komentar tidak boleh kosong" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        content: true,
        author: {
          select: {
            username: true,
            settings: { select: { whoCanReply: true } },
          },
        },
      },
    });
    if (!post) {
      return NextResponse.json(
        { error: "Postingan tidak ditemukan" },
        { status: 404 }
      );
    }

    const commenter = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (!commenter) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    if (userId !== post.authorId) {
      const replyPolicy = post.author.settings?.whoCanReply ?? "everyone";

      if (replyPolicy === "following") {
        const follows = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: post.authorId,
              followingId: userId,
            },
          },
          select: { id: true },
        });
        if (!follows) {
          return NextResponse.json(
            { error: "Hanya orang yang diikuti penulis yang dapat membalas." },
            { status: 403 }
          );
        }
      } else if (replyPolicy === "mentioned") {
        const handle = `@${commenter.username.toLowerCase()}`;
        if (!post.content.toLowerCase().includes(handle)) {
          return NextResponse.json(
            { error: "Hanya akun yang disebut di postingan yang dapat membalas." },
            { status: 403 }
          );
        }
      }
    }

    const trimmed = content.trim();
    const comment = await prisma.postComment.create({
      data: {
        postId: id,
        userId,
        content: trimmed,
      },
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
    });

    const excerpt = trimmed.slice(0, 140);
    await notifyUser({
      userId: post.authorId,
      actorId: userId,
      type: "reply",
      postId: post.id,
      message: excerpt,
    });

    const handles = new Set<string>();
    for (const match of trimmed.matchAll(MENTION_RE)) {
      handles.add(match[1].toLowerCase());
    }

    if (handles.size > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: [...handles] } },
        select: {
          id: true,
          username: true,
          settings: { select: { whoCanTag: true } },
        },
      });

      for (const target of mentionedUsers) {
        if (target.id === userId || target.id === post.authorId) continue;

        const tagPolicy = target.settings?.whoCanTag ?? "everyone";
        if (tagPolicy === "none") continue;
        if (tagPolicy === "following") {
          const follows = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: target.id,
                followingId: userId,
              },
            },
            select: { id: true },
          });
          if (!follows) continue;
        }

        await notifyUser({
          userId: target.id,
          actorId: userId,
          type: "mention",
          postId: post.id,
          message: excerpt,
        });
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim komentar" },
      { status: 500 }
    );
  }
}
