import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.trim()) {
        return NextResponse.json(
         { error: "Email wajib diisi" },
         { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}