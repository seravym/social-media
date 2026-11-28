
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

// GET: Mengambil daftar anggota List
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
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
      select: {
        id: true,
        ownerId: true,
        isPrivate: true,
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 }
      );
    }

    if (list.isPrivate && list.ownerId !== currentUserId) {
      const isMember = await prisma.listMember.findUnique({
        where: {
          listId_userId: {
            listId,
            userId: currentUserId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { success: false, message: "This list is private" },
          { status: 403 }
        );
      }
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

// POST: Menambahkan akun ke List
export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);
    const body = await request.json();
    const targetUserId = body.userId;

    if (
      !Number.isInteger(listId) ||
      listId <= 0 ||
      typeof targetUserId !== "string" ||
      !targetUserId.trim()
    ) {
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

    if (list.ownerId !== currentUserId) {
      return NextResponse.json(
        { success: false, message: "Only the List owner can add accounts" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const existingMember = await prisma.listMember.findUnique({
      where: {
        listId_userId: {
          listId,
          userId: targetUserId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: "This account is already in the List" },
        { status: 409 }
      );
    }

    const member = await prisma.listMember.create({
      data: {
        listId,
        userId: targetUserId,
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
        message: "Account added successfully",
        data: member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST List Member Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add account" },
      { status: 500 }
    );
  }
}

// DELETE: Mengeluarkan akun dari List
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listId = Number(id);
    const targetUserId = request.nextUrl.searchParams.get("userId");

    if (
      !Number.isInteger(listId) ||
      listId <= 0 ||
      !targetUserId
    ) {
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

    if (list.ownerId !== currentUserId) {
      return NextResponse.json(
        { success: false, message: "Only the List owner can remove accounts" },
        { status: 403 }
      );
    }

    if (targetUserId === list.ownerId) {
      return NextResponse.json(
        { success: false, message: "The List owner cannot be removed" },
        { status: 403 }
      );
    }

    const result = await prisma.listMember.deleteMany({
      where: {
        listId,
        userId: targetUserId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "Account not found in this List" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account removed successfully",
    });
  } catch (error) {
    console.error("DELETE List Member Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to remove account" },
      { status: 500 }
    );
  }
}
