import { NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { toProfile } from "@/lib/dto";
import type { FriendsResponse } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const friends = await db
    .select({ friend: users })
    .from(friendships)
    .innerJoin(
      users,
      eq(users.id, sql`case when ${friendships.userId} = ${user.id} then ${friendships.friendId} else ${friendships.userId} end`),
    )
    .where(
      and(eq(friendships.status, "accepted"), or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id))),
    )
    .orderBy(users.username);

  const incoming = await db
    .select({ id: friendships.id, createdAt: friendships.createdAt, sender: users })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.userId))
    .where(and(eq(friendships.friendId, user.id), eq(friendships.status, "pending")))
    .orderBy(friendships.createdAt);

  const body: FriendsResponse = {
    friends: friends.map((row) => toProfile(row.friend)),
    incoming: incoming.map((row) => ({
      id: row.id,
      created_at: row.createdAt.toISOString(),
      sender: toProfile(row.sender),
    })),
  };
  return NextResponse.json(body);
}
