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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: community,
    });
  } catch (error) {
    console.error("GET COMMUNITY DETAIL ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch community detail" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { name, description, image, userId } = body;

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    if (community.creatorId !== userId) {
      return NextResponse.json(
        { message: "Only the creator can update this community" },
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
      message: "Community updated successfully",
      data: updatedCommunity,
    });
  } catch (error) {
    console.error("UPDATE COMMUNITY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update community" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { userId } = await request.json();

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    if (community.creatorId !== userId) {
      return NextResponse.json(
        { message: "Only the creator can delete this community" },
        { status: 403 }
      );
    }

    await prisma.community.delete({
      where: { id: communityId },
    });

    return NextResponse.json({
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COMMUNITY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to delete community" },
      { status: 500 }
    );
  }
}