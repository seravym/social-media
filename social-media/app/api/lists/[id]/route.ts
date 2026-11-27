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
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID" },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    const isMember = list.members.some(
      (member) => member.userId === userId
    );

    if (list.isPrivate && list.ownerId !== userId && !isMember) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to view this list" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("GET List Detail Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch list" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    if (existingList.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to edit this list" },
        { status: 403 }
      );
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { success: false, message: "List name is required" },
        { status: 400 }
      );
    }

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "List updated successfully",
      data: updatedList,
    });
  } catch (error) {
    console.error("PUT List Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);

    if (!Number.isInteger(listId) || listId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID" },
        { status: 400 }
      );
    }

    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    if (existingList.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to delete this list" },
        { status: 403 }
      );
    }

    await prisma.list.delete({
      where: { id: listId },
    });

    return NextResponse.json({
      success: true,
      message: "List deleted successfully",
    });
  } catch (error) {
    console.error("DELETE List Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete list" },
      { status: 500 }
    );
  }
}
