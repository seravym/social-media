import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));

    if (!user || !valid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Email belum diverifikasi" }, { status: 403 });
    }

    await createSession(user.id);
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