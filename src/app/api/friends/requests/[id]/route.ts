import { and, eq, or } from "drizzle-orm";
import { getCurrentUser, isUuid, jsonError, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { publish } from "@/lib/events";

type Context = { params: Promise<{ id: string }> };

// Accept an incoming friend request
export async function PATCH(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Request not found", 404);

  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.id, id), eq(friendships.friendId, user.id), eq(friendships.status, "pending")))
    .returning();
  if (!updated) return jsonError("Request not found", 404);

  await publish([updated.userId, updated.friendId], { type: "friendships_changed" });
  return new Response(null, { status: 204 });
}

// Reject an incoming request (or cancel an outgoing one)
export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Request not found", 404);

  const [deleted] = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, id),
        eq(friendships.status, "pending"),
        or(eq(friendships.friendId, user.id), eq(friendships.userId, user.id)),
      ),
    )
    .returning();
  if (!deleted) return jsonError("Request not found", 404);

  await publish([deleted.userId, deleted.friendId], { type: "friendships_changed" });
  return new Response(null, { status: 204 });
}
