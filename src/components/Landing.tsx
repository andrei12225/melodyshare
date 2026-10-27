import { ReactNode } from "react";
import { RiBarChartFill, RiHeartFill, RiMusic2Fill, RiCompassDiscoverFill } from "react-icons/ri";
import LoginButton from "./LoginButton";

export function HeroSection({ error }: { error?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 mb-8">
      <div className="absolute inset-0 bg-[url('/wave.svg')] opacity-5 bg-cover bg-center" />
      <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6">
          <RiMusic2Fill className="text-7xl text-spotify-green animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">MelodyShare</h1>
        <p className="text-xl text-zinc-300 mb-8">Your personal Spotify listening stats</p>
        <div className="flex items-center gap-2 text-zinc-400 mb-6">
          <span>Connect with</span>
          <span className="text-spotify-green font-semibold">Spotify</span>
          <span>to get started</span>
        </div>
        <LoginButton />
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="bg-zinc-900/50 hover:bg-zinc-800/50 rounded-xl p-6 transition-all duration-300 cursor-pointer group">
      <div className="text-spotify-green text-3xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">What's Inside</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={<RiBarChartFill />}
          title="Listening Stats"
          description="View your top tracks, artists, and genres over time"
        />
        <FeatureCard
          icon={<RiHeartFill />}
          title="Liked Songs"
          description="Browse and manage your saved tracks"
        />
        <FeatureCard
          icon={<RiCompassDiscoverFill />}
          title="Discover"
          description="Find new music based on your listening habits"
        />
      </div>
    </div>
  );
}
