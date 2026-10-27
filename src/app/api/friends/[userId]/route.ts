import { getCurrentUser, isUuid, jsonError, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { publish } from "@/lib/events";
import { between } from "@/lib/friends";

// Remove a friend
export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { userId } = await params;
  if (!isUuid(userId)) return jsonError("User not found", 404);

  await db.delete(friendships).where(between(user.id, userId));

  await publish([user.id, userId], { type: "friendships_changed" });
  return new Response(null, { status: 204 });
}
