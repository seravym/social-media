import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/route";
import { clearNotification, notifyUser } from "@/lib/notify";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(body?.userId);

    if (!userId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json(
        { error: "Postingan tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      await clearNotification({
        userId: post.authorId,
        actorId: userId,
        type: "like",
        postId: id,
      });
      const likeCount = await prisma.postLike.count({ where: { postId: id } });
      return NextResponse.json({ liked: false, likeCount });
    }

    await prisma.postLike.create({
      data: {
        postId: id,
        userId,
      },
    });
    await notifyUser({
      userId: post.authorId,
      actorId: userId,
      type: "like",
      postId: id,
    });

    const likeCount = await prisma.postLike.count({ where: { postId: id } });
    return NextResponse.json({ liked: true, likeCount });
  } catch (error) {
    console.error("POST /api/posts/[id]/like error:", error);
    return NextResponse.json(
      { error: "Gagal memproses like" },
      { status: 500 }
    );
  }
}
