
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

// GET COMMUNITY DETAIL + POSTS + LIKE STATUS
export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);

    const userId =
      (await getSessionUserId()) ||
      process.env.NEXT_PUBLIC_TEST_USER_ID ||
      "";

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
        },
        _count: {
          select: {
            members: true,
            posts: true,
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
      posts: community.posts.map((post) => {
        const { likes, ...postData } = post;

        return {
          ...postData,
          isLiked: likes.length > 0,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      data: formattedCommunity,
    });
  } catch (error) {
    console.error("GET COMMUNITY DETAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch community detail",
      },
      { status: 500 }
    );
  }
}

// UPDATE COMMUNITY
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, image, userId } = body;

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
          message: "Only the creator can update this community",
        },
        { status: 403 }
      );
    }

    const updatedCommunity = await prisma.community.update({
      where: { id: communityId },
      data: {
        name,
        description,
        image,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Community updated successfully",
      data: updatedCommunity,
    });
  } catch (error) {
    console.error("UPDATE COMMUNITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update community",
      },
      { status: 500 }
    );
  }
}

// DELETE COMMUNITY
export async function DELETE(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const { userId } = await request.json();

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

    await prisma.community.delete({
      where: { id: communityId },
    });

    return NextResponse.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COMMUNITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete community",
      },
      { status: 500 }
    );
  }
}
