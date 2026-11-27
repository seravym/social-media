
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId =
      (await getSessionUserId()) ||
      process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!userId) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    const posts = await prisma.post.findMany({
      where: {
        community: {
          is: {
            members: {
              some: {
                userId,
              },
            },
          },
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
        community: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
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

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      views: post.views,
      createdAt: post.createdAt,
      author: post.author,
      community: post.community,
      _count: post._count,
      isLiked: post.likes.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts,
    });
  } catch (error) {
    console.error("GET /api/commmunities/home error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil postingan komunitas" },
      { status: 500 }
    );
  }
}
