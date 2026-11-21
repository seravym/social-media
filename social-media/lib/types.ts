export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationDto {
  id: string;
  type: "like" | "follow" | "reply" | "mention" | "system";
  actor: UserCard | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessageDto {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  other: UserCard | null;
  lastMessage: ChatMessageDto | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetailDto {
  id: string;
  other: UserCard | null;
  messages: ChatMessageDto[];
}