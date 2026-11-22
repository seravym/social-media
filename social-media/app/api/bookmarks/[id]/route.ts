
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

// DELETE: Menghapus Bookmark berdasarkan ID
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const bookmarkId = Number(id);
    const userId = request.nextUrl.searchParams.get("userId");

    if (!Number.isInteger(bookmarkId) || bookmarkId <= 0 || !userId) {
      return NextResponse.json(
        { success: false, message: "Invalid bookmark ID or user ID" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { success: false, message: "Bookmark not found" },
        { status: 404 }
      );
    }

    if (bookmark.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to delete this bookmark" },
        { status: 403 }
      );
    }

    await prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bookmark deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Bookmark Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
