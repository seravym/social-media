import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto";
import { authed, json } from "@/lib/route";

export const GET = authed(async (user, req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: userCardSelect,
    orderBy: { username: "asc" },
    take: 20,
  });

  return json({ items: users.map(toUserCard) });
});
