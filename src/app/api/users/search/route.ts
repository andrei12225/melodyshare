import { NextRequest, NextResponse } from "next/server";
import { and, ilike, ne, or } from "drizzle-orm";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { toProfile } from "@/lib/dto";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json([]);

  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const results = await db
    .select()
    .from(users)
    .where(and(ne(users.id, user.id), or(ilike(users.username, pattern), ilike(users.fullName, pattern))))
    .limit(10);

  return NextResponse.json(results.map(toProfile));
}
