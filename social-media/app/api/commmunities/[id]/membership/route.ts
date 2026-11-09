import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communityId = Number(id);

    if (isNaN(communityId)) {
      return NextResponse.json(
        { message: "Invalid community ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
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
      isMember: Boolean(membership),
      data: membership,
    });
  } catch (error) {
    console.error("CHECK MEMBERSHIP ERROR:", error);

    return NextResponse.json(
      { message: "Failed to check membership" },
      { status: 500 }
    );
  }
}