
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const community = await prisma.community.findUnique({
      where: { id: communityId },
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

    const membership = await prisma.communityMember.create({
      data: {
        userId,
        communityId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined community",
        data: membership,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("JOIN Community Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to join community. You may already be a member.",
      },
      { status: 409 }
    );
  }
}
