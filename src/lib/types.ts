// Shapes shared between the API routes and the client components

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface CurrentUser extends Profile {
  email: string | null;
}

export interface FriendRequest {
  id: string;
  created_at: string;
  sender: Profile;
}

export interface FriendsResponse {
  friends: Profile[];
  incoming: FriendRequest[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export type RealtimeEvent =
  | { type: "friendships_changed" }
  | { type: "friend_request"; from: Profile }
  | { type: "message"; message: Message }
  | { type: "message_deleted"; id: string }
  // Emitted client-side when the event stream reconnects, so views can resync
  | { type: "reconnected" };
