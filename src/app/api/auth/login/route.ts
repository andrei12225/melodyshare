import { NextRequest, NextResponse } from "next/server";
import { appUrl, cookieOptions, randomToken } from "@/lib/auth";
import { getAuthorizeUrl } from "@/lib/spotify-server";

export async function GET(request: NextRequest) {
  // Cookies are per-host, so make sure the whole flow happens on APP_URL
  // (e.g. someone opened http://localhost:3000 but APP_URL is 127.0.0.1)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host !== appUrl.host) {
    return NextResponse.redirect(new URL("/api/auth/login", appUrl));
  }

  const state = randomToken();
  let authorizeUrl: URL;
  try {
    authorizeUrl = getAuthorizeUrl(state);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/?error=not_configured", appUrl));
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("oauth_state", state, cookieOptions(10 * 60));
  return response;
}
