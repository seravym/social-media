import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const memberships = await prisma.communityMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        community: {
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
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const communities = memberships.map((item) => ({
      ...item.community,
      joinedAt: item.joinedAt,
    }));

    return NextResponse.json({
      data: communities,
    });
  } catch (error) {
    console.error("GET MY COMMUNITIES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch joined communities" },
      { status: 500 }
    );
  }
}