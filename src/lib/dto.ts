import type { Message as MessageRow, User } from "./db/schema";
import type { CurrentUser, Message, Profile } from "./types";

export function toProfile(user: Pick<User, "id" | "username" | "fullName" | "avatarUrl">): Profile {
  return {
    id: user.id,
    username: user.username,
    full_name: user.fullName,
    avatar_url: user.avatarUrl,
  };
}

export function toCurrentUser(user: User): CurrentUser {
  return { ...toProfile(user), email: user.email };
}

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    sender_id: row.senderId,
    receiver_id: row.receiverId,
    content: row.content,
    read: row.read,
    created_at: row.createdAt.toISOString(),
  };
}
