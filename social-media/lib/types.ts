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