import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.delete("session");
  return NextResponse.json({ message: "Logout berhasil" });
}