import { getCurrentUser } from "@/lib/auth";
import HomeDashboard from "@/components/HomeDashboard";
import { FeaturesSection, HeroSection } from "@/components/Landing";

const AUTH_ERRORS: Record<string, string> = {
  access_denied: "Spotify login was cancelled.",
  invalid_state: "Login session expired. Please try again.",
  login_failed: "Could not sign in with Spotify. Your account may not be on the app's allowlist.",
  not_configured: "Spotify login is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, { error }] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) return <HomeDashboard />;

  return (
    <>
      <HeroSection error={error ? (AUTH_ERRORS[error] ?? AUTH_ERRORS.login_failed) : undefined} />
      <FeaturesSection />
    </>
  );
}
