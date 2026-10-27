import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { exchangeCode, getSpotifyMe } from "@/lib/spotify-server";

function redirectWithError(error: string) {
  const url = new URL("/", appUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  const spotifyError = params.get("error");
  if (spotifyError) return redirectWithError(spotifyError);

  const code = params.get("code");
  if (!code || !expectedState || params.get("state") !== expectedState) {
    return redirectWithError("invalid_state");
  }

  try {
    const token = await exchangeCode(code);
    if (!token.refresh_token) throw new Error("Spotify did not return a refresh token");
    const me = await getSpotifyMe(token.access_token);

    const tokenFields = {
      spotifyAccessToken: token.access_token,
      spotifyRefreshToken: token.refresh_token,
      spotifyTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
    };
    const profileFields = {
      email: me.email ?? null,
      fullName: me.display_name,
      avatarUrl: me.images?.[0]?.url ?? null,
    };

    const [user] = await db
      .insert(users)
      .values({ spotifyId: me.id, username: me.id, ...profileFields, ...tokenFields })
      .onConflictDoUpdate({
        target: users.spotifyId,
        set: { ...profileFields, ...tokenFields, updatedAt: new Date() },
      })
      .returning({ id: users.id });

    await createSession(user.id);
    return NextResponse.redirect(new URL("/", appUrl));
  } catch (error) {
    console.error("Spotify login failed:", error);
    return redirectWithError("login_failed");
  }
}
