import { NextRequest } from "next/server";
import { getCurrentUser, jsonError, unauthorized } from "@/lib/auth";
import { getSpotifyAccessToken } from "@/lib/spotify-server";

// Read-only proxy to the Spotify Web API, so access tokens never leave the server
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let accessToken: string;
  try {
    accessToken = await getSpotifyAccessToken(user);
  } catch (error) {
    console.error("Failed to refresh Spotify token:", error);
    return jsonError("Spotify session expired, please sign in again", 401);
  }

  const { path } = await params;
  const url = new URL(`https://api.spotify.com/v1/${path.map(encodeURIComponent).join("/")}`);
  url.search = request.nextUrl.search;

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });

  const headers = new Headers({ "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" });
  const retryAfter = upstream.headers.get("Retry-After");
  if (retryAfter) headers.set("Retry-After", retryAfter);

  return new Response(upstream.body, { status: upstream.status, headers });
}
