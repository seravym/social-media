import { prisma } from "@/lib/prisma";

interface DirectMessageCheckInput {
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
}

export type DirectMessagePermission =
  | { allowed: true }
  | { allowed: false; reason: string };

export async function checkDirectMessagePermission({
  senderId,
  senderUsername,
  recipientId,
  recipientUsername,
}: DirectMessageCheckInput): Promise<DirectMessagePermission> {
  if (senderId === recipientId) {
    return { allowed: true };
  }

  const [block, settings, recipientFollowsSender] = await Promise.all([
    prisma.blockedAccount.findFirst({
      where: {
        OR: [
          { userId: recipientId, username: senderUsername.toLowerCase() },
          { userId: senderId, username: recipientUsername.toLowerCase() },
        ],
      },
      select: { userId: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId: recipientId },
      select: { whoCanMessage: true },
    }),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: recipientId,
          followingId: senderId,
        },
      },
      select: { id: true },
    }),
  ]);

  if (block) {
    return {
      allowed: false,
      reason:
        block.userId === senderId
          ? "Kamu telah memblokir pengguna ini."
          : "Kamu tidak dapat mengirim pesan ke pengguna ini.",
    };
  }

  const policy = settings?.whoCanMessage ?? "everyone";

  if (policy === "none") {
    return {
      allowed: false,
      reason: "Pengguna ini tidak menerima pesan langsung.",
    };
  }

  if (policy === "following" && !recipientFollowsSender) {
    return {
      allowed: false,
      reason: "Hanya akun yang diikuti pengguna ini yang dapat mengirim pesan.",
    };
  }

  return { allowed: true };
}