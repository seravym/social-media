import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";
import {
  getModerationFilters,
  isMutedAuthor,
  isMutedContent,
} from "@/lib/moderation";

export const GET = authed(async (me, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const words = q.split(/\s+/).filter(Boolean);

  const textFilter = (fields: string[]) =>
    words.map((w) => ({
      OR: fields.map((f) => ({
        [f]: {
          contains: w,
          mode: "insensitive" as const,
        },
      })),
    }));

  const filters = await getModerationFilters(me.id);

  const [news, trending, postRows, accountRows] = await Promise.all([
    prisma.news.findMany({
      where: { AND: textFilter(["title", "summary"]) },
      orderBy: { createdAt: "desc" },
    }),

    prisma.trendingTopic.findMany({
      where: { AND: textFilter(["name"]) },
      orderBy: { postCount: "desc" },
    }),

    prisma.post.findMany({
      where: { AND: textFilter(["content"]) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),

    prisma.user.findMany({
      where: {
        id: { not: me.id },
        NOT: { settings: { is: { showInSuggestions: false } } },
        ...(words.length ? { AND: textFilter(["username", "name"]) } : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
      orderBy: { createdAt: "desc" },
      take: words.length ? 10 : 3,
    }),
  ]);

  const posts = postRows.filter(
    (post) =>
      !isMutedAuthor(post.author.username, filters) &&
      !isMutedContent(post.content, filters.words),
  );

  const accounts = accountRows.filter(
    (account) => !isMutedAuthor(account.username, filters),
  );

  return json({ news, trending, posts, accounts });
});