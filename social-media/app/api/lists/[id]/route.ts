
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

// GET: Mengambil detail list
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
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

// PUT: Mengedit list
export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const body = await request.json();

    const { name, description, isPrivate, ownerId } = body;

    if (!Number.isInteger(listId) || listId <= 0 || !ownerId) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID or owner ID" },
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

    if (existingList.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to edit this list" },
        { status: 403 }
      );
    }

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(name !== undefined && { name }),
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

// DELETE: Menghapus list
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const ownerId = request.nextUrl.searchParams.get("ownerId");

    if (!Number.isInteger(listId) || listId <= 0 || !ownerId) {
      return NextResponse.json(
        { success: false, message: "Invalid list ID or owner ID" },
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

    if (existingList.ownerId !== ownerId) {
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
