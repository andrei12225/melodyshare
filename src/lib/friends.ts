import "server-only";
import { and, eq, or } from "drizzle-orm";
import { db } from "./db";
import { friendships } from "./db/schema";

// Matches the friendship row between two users, in either direction
export function between(a: string, b: string) {
  return or(
    and(eq(friendships.userId, a), eq(friendships.friendId, b)),
    and(eq(friendships.userId, b), eq(friendships.friendId, a)),
  );
}

export async function areFriends(a: string, b: string) {
  const [row] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(between(a, b), eq(friendships.status, "accepted")))
    .limit(1);
  return !!row;
}
