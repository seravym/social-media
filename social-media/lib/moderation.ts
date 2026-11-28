import { prisma } from "@/lib/prisma";

export interface ModerationFilters {
  words: string[];
  usernames: Set<string>;
}

const EMPTY_FILTERS: ModerationFilters = {
  words: [],
  usernames: new Set(),
};

export async function getModerationFilters(
  userId: string | null,
): Promise<ModerationFilters> {
  if (!userId) return EMPTY_FILTERS;

  const [words, muted, blocked] = await Promise.all([
    prisma.mutedWord.findMany({
      where: { userId },
      select: { word: true },
    }),
    prisma.mutedAccount.findMany({
      where: { userId },
      select: { username: true },
    }),
    prisma.blockedAccount.findMany({
      where: { userId },
      select: { username: true },
    }),
  ]);

  return {
    words: words
      .map((item) => item.word.trim().toLowerCase())
      .filter(Boolean),
    usernames: new Set(
      [...muted, ...blocked].map((item) => item.username.toLowerCase()),
    ),
  };
}

export function isMutedAuthor(
  username: string | null | undefined,
  filters: ModerationFilters,
): boolean {
  if (!username) return false;
  return filters.usernames.has(username.toLowerCase());
}

export function isMutedContent(
  text: string | null | undefined,
  words: string[],
): boolean {
  if (!text || words.length === 0) return false;
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}
