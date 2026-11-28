import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // cek import prisma di app/api/articles/route.ts kalau path-nya beda

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            views: true,
            createdAt: true,
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil data profil" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const cleanName = String(body.displayName || "").trim() || "Nama Akun";
    const rawUsername = String(body.username || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 15);
    const cleanUsername = rawUsername ? `@${rawUsername}` : "@username";
    const cleanBio = String(body.bio || "").slice(0, 35);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: cleanName,
        username: cleanUsername,
        bio: cleanBio,
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Username sudah dipakai pengguna lain" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menyimpan profil" },
      { status: 500 }
    );
  }
}