import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Email dan kode 6 digit wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const otp = user
      ? await prisma.otpCode.findFirst({
          where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!user || !otp || !(await bcrypt.compare(code, otp.codeHash))) {
      return NextResponse.json({ error: "Kode salah atau kedaluwarsa" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    ]);

    await createSession(user.id);
    return NextResponse.json({ message: "Verifikasi berhasil" });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}