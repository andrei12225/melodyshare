import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, or } from "drizzle-orm";
import { getCurrentUser, isUuid, jsonError, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { toMessage } from "@/lib/dto";
import { publish } from "@/lib/events";
import { areFriends } from "@/lib/friends";

// Postgres NOTIFY payloads are capped at 8000 bytes, so keep messages well below that
const MAX_MESSAGE_LENGTH = 2000;

// Conversation with another user: GET /api/messages?with=<userId>
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const otherId = request.nextUrl.searchParams.get("with");
  if (!isUuid(otherId)) return jsonError("Missing or invalid 'with' parameter", 400);

  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, user.id), eq(messages.receiverId, otherId)),
        and(eq(messages.senderId, otherId), eq(messages.receiverId, user.id)),
      ),
    )
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(rows.map(toMessage));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { receiverId, content } = (await request.json().catch(() => ({}))) as {
    receiverId?: string;
    content?: string;
  };
  const text = typeof content === "string" ? content.trim() : "";
  if (!isUuid(receiverId) || !text) return jsonError("Invalid message", 400);
  if (text.length > MAX_MESSAGE_LENGTH) return jsonError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters`, 400);
  if (!(await areFriends(user.id, receiverId))) return jsonError("You can only message friends", 403);

  const [row] = await db.insert(messages).values({ senderId: user.id, receiverId, content: text }).returning();
  const message = toMessage(row);

  await publish([user.id, receiverId], { type: "message", message });
  return NextResponse.json(message, { status: 201 });
}
