import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: communities,
    });
  } catch (error) {
    console.error("GET Communities Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch communities",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, description, image } = body;

    const creatorId =
      body.creatorId || process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Creator ID is required",
        },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Community name is required",
        },
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

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        image: image?.trim() || null,
        creatorId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Community created successfully",
        data: community,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Community Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create community",
      },
      { status: 500 }
    );
  }
}
