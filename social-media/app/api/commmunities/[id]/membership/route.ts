
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

// CHECK MEMBERSHIP
export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      isMember: !!membership,
    });
  } catch (error) {
    console.error("GET MEMBERSHIP ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to check membership" },
      { status: 500 }
    );
  }
}

// JOIN COMMUNITY
export async function POST(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

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

    const membership = await prisma.communityMember.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      update: {},
      create: {
        userId,
        communityId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Joined community successfully",
      data: membership,
    });
  } catch (error) {
    console.error("JOIN COMMUNITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to join community" },
      { status: 500 }
    );
  }
}

// LEAVE COMMUNITY
export async function DELETE(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    if (!Number.isInteger(communityId) || communityId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid community ID" },
        { status: 400 }
      );
    }

    await prisma.communityMember.deleteMany({
      where: {
        userId,
        communityId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Left community successfully",
    });
  } catch (error) {
    console.error("LEAVE COMMUNITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to leave community" },
      { status: 500 }
    );
  }
}
