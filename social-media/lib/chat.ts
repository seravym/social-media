import type { ChatMessageDto, ChatReactionDto } from "@/lib/types";

export const messageInclude = {
  replyTo: {
    select: {
      id: true,
      body: true,
      senderId: true,
      deletedAt: true,
    },
  },
  reactions: {
    select: {
      emoji: true,
      userId: true,
    },
  },
} as const;

interface MessageRow {
  id: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  isForwarded: boolean;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  pinnedAt: Date | null;
  replyTo: {
    id: string;
    body: string;
    senderId: string;
    deletedAt: Date | null;
  } | null;
  reactions: { emoji: string; userId: string }[];
}

export function toMessageDto(
  message: MessageRow,
  currentUserId: string,
): ChatMessageDto {
  const byEmoji = new Map<string, ChatReactionDto>();
  const reactions: ChatReactionDto[] = [];

  for (const reaction of message.reactions) {
    let entry = byEmoji.get(reaction.emoji);
    if (!entry) {
      entry = { emoji: reaction.emoji, count: 0, mine: false };
      byEmoji.set(reaction.emoji, entry);
      reactions.push(entry);
    }
    entry.count += 1;
    if (reaction.userId === currentUserId) entry.mine = true;
  }

  return {
    id: message.id,
    senderId: message.senderId,
    body: message.deletedAt ? "" : message.body,
    imageUrl: message.deletedAt ? null : message.imageUrl,
    isForwarded: message.isForwarded,
    editedAt: message.editedAt ? message.editedAt.toISOString() : null,
    deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
    createdAt: message.createdAt.toISOString(),
    pinnedAt: message.pinnedAt ? message.pinnedAt.toISOString() : null,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          senderId: message.replyTo.senderId,
          body: message.replyTo.deletedAt ? "" : message.replyTo.body,
        }
      : null,
    reactions: message.deletedAt ? [] : reactions,
  };
}
