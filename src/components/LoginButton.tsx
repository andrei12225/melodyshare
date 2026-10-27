import { FaSpotify } from "react-icons/fa";

export default function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      className="bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-200 hover:scale-105"
    >
      <FaSpotify className="text-xl" />
      <span>Connect with Spotify</span>
    </a>
  );
}
