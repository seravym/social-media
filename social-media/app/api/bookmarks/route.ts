
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Mengambil semua Bookmark milik user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    console.error("GET Bookmarks Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

// POST: Menyimpan postingan ke Bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, message: "Post ID and User ID are required" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        postId,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Post bookmarked successfully",
        data: bookmark,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Bookmark Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to bookmark post" },
      { status: 500 }
    );
  }
}
