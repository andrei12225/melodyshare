import { getCurrentUser } from "@/lib/auth";
import { toCurrentUser } from "@/lib/dto";
import MainPage from "@/components/MainPage";

const AUTH_ERRORS: Record<string, string> = {
  access_denied: "Spotify login was cancelled.",
  invalid_state: "Login session expired. Please try again.",
  login_failed: "Could not sign in with Spotify. Please try again.",
  not_configured: "Spotify login is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, { error }] = await Promise.all([getCurrentUser(), searchParams]);

  return (
    <MainPage
      user={user ? toCurrentUser(user) : null}
      authError={error ? (AUTH_ERRORS[error] ?? AUTH_ERRORS.login_failed) : undefined}
    />
  );
}
