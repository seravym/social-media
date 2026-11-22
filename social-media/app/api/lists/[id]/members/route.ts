
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

// GET: Mengambil daftar anggota List
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

    const members = await prisma.listMember.findMany({
      where: { listId },
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
      orderBy: {
        addedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("GET List Members Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST: Menambahkan anggota ke List
export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const body = await request.json();

    const { userId, ownerId } = body;

    if (!Number.isInteger(listId) || listId <= 0 || !userId) {
      return NextResponse.json(
        { success: false, message: "List ID and user ID are required" },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    if (list.isPrivate && list.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, message: "This list is private" },
        { status: 403 }
      );
    }

    const member = await prisma.listMember.create({
      data: {
        listId,
        userId,
      },
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
    });

    return NextResponse.json(
      {
        success: true,
        message: "Member added successfully",
        data: member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST List Member Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add member" },
      { status: 500 }
    );
  }
}

// DELETE: Mengeluarkan anggota dari List
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const listId = Number(id);
    const userId = request.nextUrl.searchParams.get("userId");
    const ownerId = request.nextUrl.searchParams.get("ownerId");

    if (!Number.isInteger(listId) || listId <= 0 || !userId) {
      return NextResponse.json(
        { success: false, message: "List ID and user ID are required" },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    if (list.ownerId !== ownerId && userId !== ownerId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to remove this member" },
        { status: 403 }
      );
    }

    const result = await prisma.listMember.deleteMany({
      where: {
        listId,
        userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("DELETE List Member Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to remove member" },
      { status: 500 }
    );
  }
}
