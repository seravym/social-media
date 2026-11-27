// Simpan sebagai: app/api/explore/route.ts
import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

// GET /api/explore?q=kata
// Tanpa q  : semua berita, semua trending (urut postCount), dan 3 akun saran
// Dengan q : hasil yang cocok di berita, trending, dan akun
export const GET = authed(async (me, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  // beberapa kata: semuanya harus cocok
  const words = q.split(/\s+/).filter(Boolean);
  const textFilter = (fields: string[]) =>
    words.map((w) => ({
      OR: fields.map((f) => ({ [f]: { contains: w, mode: "insensitive" as const } })),
    }));

  const [news, trending] = await Promise.all([
    prisma.news.findMany({
      where: { AND: textFilter(["title", "summary"]) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trendingTopic.findMany({
      where: { AND: textFilter(["name"]) },
      orderBy: { postCount: "desc" },
    }),
  ]);

  // akun: saat mencari, cari berdasarkan nama/username. Tanpa pencarian, tampilkan 3 saran.
  const accounts = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      ...(words.length
        ? { AND: textFilter(["username", "name"]) }
        : {}),
    },
    select: { id: true, name: true, username: true },
    orderBy: { createdAt: "desc" },
    take: words.length ? 10 : 3,
  });

  return json({ news, trending, accounts });
});