
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

async function getCurrentUserId() {
  return (
    (await getSessionUserId()) ||
    process.env.NEXT_PUBLIC_TEST_USER_ID ||
    null
  );
}

// GET: Mengambil semua List milik user
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const lists = await prisma.list.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error) {
    console.error("GET Lists Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

// POST: Membuat List baru
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "List name is required" },
        { status: 400 }
      );
    }

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        isPrivate: isPrivate ?? false,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "List created successfully",
        data: list,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Lists Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create list" },
      { status: 500 }
    );
  }
}
