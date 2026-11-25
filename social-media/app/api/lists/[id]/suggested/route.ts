import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const ownerId = request.nextUrl.searchParams.get("ownerId");

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID." },
        { status: 400 }
      );
    }

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID is required." },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found." },
        { status: 404 }
      );
    }

    if (list.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to manage this list." },
        { status: 403 }
      );
    }

    const excludedUserIds = [
      list.ownerId,
      ...list.members.map((member) => member.userId),
    ];

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: excludedUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get Suggested Users Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch suggested users." },
      { status: 500 }
    );
  }
}
