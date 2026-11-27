import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";

const schema = z
  .object({
    username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { username, email, password } = parsed.data;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email atau username sudah dipakai" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });

    await createOtp(user.id, user.email);

    return NextResponse.json(
      { message: "Akun dibuat. Cek kode OTP.", email: user.email },
      { status: 201 }
    );
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}