
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const userId = await getSessionUserId();

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
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
          select: { userId: true },
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
              where: { userId: userId ?? "" },
              select: { userId: true },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, message: "Community not found" },
        { status: 404 }
      );
    }

    const formattedCommunity = {
      ...community,

      // Cek apakah user yang login adalah creator komunitas
      isCreator: Boolean(
        userId && community.creatorId === userId
      ),

      posts: community.posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      })),
    };

    return NextResponse.json({
      success: true,
      currentUserId: userId,
      data: formattedCommunity,
    });
  } catch (error) {
    console.error("GET Community Detail Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch community details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const communityId = Number(id);

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const existingCommunity = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: "Community not found" },
        { status: 404 }
      );
    }

    if (existingCommunity.creatorId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the creator can edit this community",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, image } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Community name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Community name must be at least 3 characters",
        },
        { status: 400 }
      );
    }

    const updatedCommunity = await prisma.community.update({
      where: { id: communityId },
      data: {
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        image:
          typeof image === "string" && image.trim()
            ? image.trim()
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Community updated successfully",
      data: updatedCommunity,
    });
  } catch (error) {
    console.error("PUT Community Error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, message: "Community name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update community" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const communityId = Number(id);

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, message: "Community not found" },
        { status: 404 }
      );
    }

    if (community.creatorId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the creator can delete this community",
        },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const posts = await tx.post.findMany({
        where: { communityId },
        select: { id: true },
      });

      const postIds = posts.map((post) => post.id);

      if (postIds.length > 0) {
        await tx.postComment.deleteMany({
          where: { postId: { in: postIds } },
        });

        await tx.postLike.deleteMany({
          where: { postId: { in: postIds } },
        });

        await tx.bookmark.deleteMany({
          where: { postId: { in: postIds } },
        });

        await tx.post.deleteMany({
          where: { communityId },
        });
      }

      await tx.communityMember.deleteMany({
        where: { communityId },
      });

      await tx.community.delete({
        where: { id: communityId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Community Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete community" },
      { status: 500 }
    );
  }
}
