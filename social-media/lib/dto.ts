import { UserCard } from "./types";

export const userCardSelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
};

export const toUserCard = (user: any): UserCard => ({
  id: user.id,
  username: user.username || "user",
  displayName: user.name || "user",
  avatarUrl: user.avatarUrl,
});