import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const currentUserId =
      (await getSessionUserId()) || request.nextUrl.searchParams.get("userId");

    const users = await prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : undefined,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let followingSet = new Set<string>();
    if (currentUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      followingSet = new Set(follows.map((f) => f.followingId));
    }

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatarUrl: u.avatarUrl,
      followersCount: u._count.followers,
      followingCount: u._count.following,
      isFollowing: followingSet.has(u.id),
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error("GET /api/follow error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followingId } = body;
    const followerId = (await getSessionUserId()) || body.userId;

    if (!followerId) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId wajib diisi" },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Tidak bisa mengikuti akun sendiri" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ following: false });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("POST /api/follow error:", error);
    return NextResponse.json(
      { error: "Gagal memproses follow" },
      { status: 500 }
    );
  }
}