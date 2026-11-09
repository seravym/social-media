
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communityId = Number(id);
    const body = await request.json();

    const { userId } = body;

    if (!Number.isInteger(communityId) || communityId <= 0 || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid community ID or user ID",
        },
        { status: 400 }
      );
    }

    const membership = await prisma.communityMember.deleteMany({
      where: {
        userId,
        communityId,
      },
    });

    if (membership.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a member of this community",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left community",
    });
  } catch (error) {
    console.error("LEAVE Community Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to leave community",
      },
      { status: 500 }
    );
  }
}
