import "server-only";
import { eq } from "drizzle-orm";
import { appUrl } from "./auth";
import { db } from "./db";
import { users, type User } from "./db/schema";

export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "user-top-read",
  "user-read-recently-played",
].join(" ");

export const redirectUri = new URL("/api/auth/callback", appUrl).toString();

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface SpotifyMe {
  id: string;
  display_name: string | null;
  email?: string;
  images?: { url: string }[];
}

function getClientCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

export function getAuthorizeUrl(state: string) {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: getClientCredentials().clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  }).toString();
  return url;
}

async function requestToken(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status} - ${await response.text()}`);
  }
  return response.json();
}

export function exchangeCode(code: string) {
  return requestToken({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
}

export async function getSpotifyMe(accessToken: string): Promise<SpotifyMe> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to load Spotify profile: ${response.status} - ${await response.text()}`);
  }
  return response.json();
}

// Returns a valid access token for the user, refreshing it if it is about to expire
export async function getSpotifyAccessToken(user: User): Promise<string> {
  if (user.spotifyTokenExpiresAt.getTime() - Date.now() > 60_000) {
    return user.spotifyAccessToken;
  }

  const token = await requestToken({
    grant_type: "refresh_token",
    refresh_token: user.spotifyRefreshToken,
  });

  await db
    .update(users)
    .set({
      spotifyAccessToken: token.access_token,
      // Spotify may or may not rotate the refresh token
      spotifyRefreshToken: token.refresh_token ?? user.spotifyRefreshToken,
      spotifyTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return token.access_token;
}
