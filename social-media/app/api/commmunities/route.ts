
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

    const { name, description, image, creatorId } = body;

    if (!name || !creatorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and creatorId are required",
        },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        image,
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
