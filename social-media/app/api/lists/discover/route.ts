
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Menampilkan List publik untuk Discover
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    const lists = await prisma.list.findMany({
      where: {
        isPrivate: false,
        ...(userId && {
          ownerId: {
            not: userId,
          },
        }),
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
    console.error("GET Discover Lists Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch discover lists" },
      { status: 500 }
    );
  }
}
