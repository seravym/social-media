
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communityId = Number(id);

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
      where: { id: communityId },
      include: {
        members: {
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
          orderBy: {
            joinedAt: "desc",
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

    return NextResponse.json({
      success: true,
      data: community.members,
      totalMembers: community.members.length,
    });
  } catch (error) {
    console.error("GET Community Members Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch community members",
      },
      { status: 500 }
    );
  }
}
