import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

const CATEGORIES = ["Technology", "Design", "Data", "Food", "Travel"];

export const GET = authed(async (me, req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") ?? "").trim();
  const author = searchParams.get("author");
  const saved = searchParams.get("saved") === "1";

  const wordFilters = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({
      OR: [
        { title: { contains: w, mode: "insensitive" as const } },
        { content: { contains: w, mode: "insensitive" as const } },
        { author: { name: { contains: w, mode: "insensitive" as const } } },
        { author: { username: { contains: w, mode: "insensitive" as const } } },
      ],
    }));

  const articles = await prisma.article.findMany({
    where: {
      status: "published",
      ...(category && CATEGORIES.includes(category) ? { category } : {}),
      ...(author ? { author: { username: author } } : {}),
      ...(saved ? { bookmarks: { some: { userId: me.id } } } : {}),
      AND: wordFilters,
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: me.id }, select: { userId: true } },
      bookmarks: { where: { userId: me.id }, select: { userId: true } },
    },
  });

  return json(
    articles.map(({ likes, bookmarks, _count, ...a }) => ({
      ...a,
      likeCount: _count.likes,
      commentCount: _count.comments,
      liked: likes.length > 0,
      saved: bookmarks.length > 0,
    }))
  );
});

export const POST = authed(async (me, req) => {
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const category = String(body?.category ?? "");
  const coverImageUrl =
    String(body?.coverImageUrl ?? "").trim() || null;

  if (title.length < 5) return json({ error: "Judul minimal 5 karakter." }, 400);
  if (content.length < 80) return json({ error: "Isi minimal 80 karakter." }, 400);
  if (!CATEGORIES.includes(category)) return json({ error: "Kategori tidak valid." }, 400);

  const article = await prisma.article.create({
    data: {
        title,
        content,
        category,
        coverImageUrl,
        authorId: me.id,
        publishedAt: new Date(),
    },
  });
  return json(article, 201);
});