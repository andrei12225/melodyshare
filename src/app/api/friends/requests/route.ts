import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser, isUuid, jsonError, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { toProfile } from "@/lib/dto";
import { publish } from "@/lib/events";
import { between } from "@/lib/friends";

// Send a friend request
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };
  if (!isUuid(userId) || userId === user.id) return jsonError("Invalid user", 400);

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return jsonError("User not found", 404);

  const [existing] = await db.select({ id: friendships.id }).from(friendships).where(between(user.id, userId)).limit(1);
  if (existing) return jsonError("Friendship or request already exists!", 409);

  await db.insert(friendships).values({ userId: user.id, friendId: userId, status: "pending" });

  await publish([userId], { type: "friend_request", from: toProfile(user) });
  await publish([user.id, userId], { type: "friendships_changed" });
  return new Response(null, { status: 201 });
}
