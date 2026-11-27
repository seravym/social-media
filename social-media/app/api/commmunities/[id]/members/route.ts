import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Mengambil daftar anggota community
export async function GET(
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
      select: {
        id: true,
        creatorId: true,
      },
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
          message: "Only the creator can manage members",
        },
        { status: 403 }
      );
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId },
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
        joinedAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        members,
        totalMembers: members.length,
      },
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

// DELETE: Mengeluarkan anggota dari community
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
      select: {
        id: true,
        creatorId: true,
      },
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
          message: "Only the creator can remove members",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const memberUserId = body.userId;

    if (typeof memberUserId !== "string" || !memberUserId.trim()) {
      return NextResponse.json(
        { success: false, message: "Member user ID is required" },
        { status: 400 }
      );
    }

    if (memberUserId === community.creatorId) {
      return NextResponse.json(
        {
          success: false,
          message: "The creator cannot be removed",
        },
        { status: 400 }
      );
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: memberUserId,
          communityId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Member not found in this community" },
        { status: 404 }
      );
    }

    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: memberUserId,
          communityId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("DELETE Community Member Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove community member",
      },
      { status: 500 }
    );
  }
}
