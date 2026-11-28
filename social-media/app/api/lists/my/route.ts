import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

// GET: Mengambil semua List yang dibuat oleh user
export async function GET(request: NextRequest) {
  try {
    const userId =
      (await getSessionUserId()) ||
      process.env.NEXT_PUBLIC_TEST_USER_ID ||
      null;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
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
    console.error("GET My Lists Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch your lists" },
      { status: 500 }
    );
  }
}
