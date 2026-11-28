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
  postId?: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatReactionDto {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ChatReplyDto {
  id: string;
  senderId: string;
  body: string;
}

export interface ChatMessageDto {
  id: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  isForwarded: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  pinnedAt?: string | null;
  replyTo?: ChatReplyDto | null;
  reactions?: ChatReactionDto[];
}

export interface ConversationMemberDto {
  user: UserCard;
  nickname: string | null;
}

export interface ConversationDto {
  id: string;
  type?: string;
  name?: string | null;
  other: UserCard | null;
  nickname: string | null;
  background: string | null;
  lastMessage: ChatMessageDto | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationListResponse {
  currentUserId: string;
  items: ConversationDto[];
}

export interface ConversationMessagesResponse {
  currentUserId: string;
  messages: ChatMessageDto[];
  hasMore: boolean;
}

export interface ConversationDetailDto {
  id: string;
  type?: string;
  name?: string | null;
  currentUserId: string;
  background: string | null;
  other: UserCard | null;
  nickname: string | null;
  members: ConversationMemberDto[];
  messages: ChatMessageDto[];
}