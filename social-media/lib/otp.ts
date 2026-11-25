import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function createOtp(userId: string, email: string) {
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 8);

  await prisma.otpCode.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // berlaku 5 menit
    },
  });

  console.log(`[OTP] ${email} -> ${code}`);
}