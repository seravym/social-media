
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

async function getCurrentUserId() {
  return (
    (await getSessionUserId()) ||
    process.env.NEXT_PUBLIC_TEST_USER_ID ||
    null
  );
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID." },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: {
        id: true,
        ownerId: true,
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

    if (list.ownerId !== currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to manage this list.",
        },
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
      {
        success: false,
        message: "Failed to fetch suggested users.",
      },
      { status: 500 }
    );
  }
}
