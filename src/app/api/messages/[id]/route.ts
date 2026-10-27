import { and, eq } from "drizzle-orm";
import { getCurrentUser, isUuid, jsonError, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { publish } from "@/lib/events";

// Delete one of your own messages
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Message not found", 404);

  const [deleted] = await db
    .delete(messages)
    .where(and(eq(messages.id, id), eq(messages.senderId, user.id)))
    .returning();
  if (!deleted) return jsonError("Message not found", 404);

  await publish([deleted.senderId, deleted.receiverId], { type: "message_deleted", id: deleted.id });
  return new Response(null, { status: 204 });
}
