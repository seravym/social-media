
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const userId = await getSessionUserId();

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid community ID",
        },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: {
        id: communityId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
            likes: {
              where: {
                userId: userId ?? "",
              },
              select: {
                userId: true,
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
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        {
          success: false,
          message: "Community not found",
        },
        { status: 404 }
      );
    }

    const formattedCommunity = {
      ...community,
      posts: community.posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedCommunity,
    });
  } catch (error) {
    console.error("GET Community Detail Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch community details",
      },
      { status: 500 }
    );
  }
}
