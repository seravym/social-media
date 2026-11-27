
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

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
    const creatorId = await getSessionUserId();

    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, image } = body;

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
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        image:
          typeof image === "string" && image.trim()
            ? image.trim()
            : null,
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
