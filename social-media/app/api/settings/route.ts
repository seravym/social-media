import { prisma } from "@/lib/prisma";
import { authed, json } from "@/lib/route";

const RULES: Record<string, (v: unknown) => boolean> = {
  theme: (v) => ["light", "dark"].includes(v as string),
  fontSize: (v) => ["small", "medium", "large"].includes(v as string),
  language: (v) => ["id", "en", "es", "ja", "ko"].includes(v as string),
  protectPosts: (v) => typeof v === "boolean",
  allowPhotoTag: (v) => typeof v === "boolean",
  showInSuggestions: (v) => typeof v === "boolean",
  whoCanReply: (v) => ["everyone", "following", "mentioned"].includes(v as string),
  whoCanTag: (v) => ["everyone", "following", "none"].includes(v as string),
  whoCanMessage: (v) => ["everyone", "following", "none"].includes(v as string),
  notifyLikes: (v) => typeof v === "boolean",
  notifyFollows: (v) => typeof v === "boolean",
  notifyReplies: (v) => typeof v === "boolean",
  notifyToast: (v) => typeof v === "boolean",
};

const publicFields = (s: Record<string, unknown>) =>
  Object.fromEntries(Object.keys(RULES).map((k) => [k, s[k]]));

export const GET = authed(async (me) => {
  const settings = await prisma.userSettings.upsert({
    where: { userId: me.id },
    update: {},
    create: { userId: me.id },
  });
  return json(publicFields(settings as unknown as Record<string, unknown>));
});

export const PUT = authed(async (me, req) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ error: "Data tidak valid" }, 400);
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const rule = RULES[key];
    if (!rule) continue;
    if (!rule(value)) return json({ error: `Nilai ${key} tidak valid` }, 400);
    data[key] = value;
  }
  if (Object.keys(data).length === 0) {
    return json({ error: "Tidak ada perubahan" }, 400);
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: me.id },
    update: data,
    create: { userId: me.id, ...data },
  });
  return json(publicFields(settings as unknown as Record<string, unknown>));
});