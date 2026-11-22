
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Mengambil semua list milik user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const lists = await prisma.list.findMany({
      where: {
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

// POST: Membuat list baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, isPrivate, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, message: "Name and owner ID are required" },
        { status: 400 }
      );
    }

    const list = await prisma.list.create({
      data: {
        name,
        description: description || null,
        isPrivate: isPrivate ?? false,
        ownerId,
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
