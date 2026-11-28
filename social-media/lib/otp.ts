import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function createOtp(userId: string, email: string) {
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 8);

  await prisma.otpCode.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
    },
  });

  // kode tampil di terminal untuk tes
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] ${email} -> ${code}`);
  }

  try {
    await transporter.sendMail({
      from: `"Social Media" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Kode verifikasi kamu",
      text: `Kode OTP kamu: ${code}. Kode hanya berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`,
    });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
  }
}