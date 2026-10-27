"use client";

import { useEffect, useState } from "react";
import { RiBarChartFill, RiHeartFill, RiMusic2Fill, RiTimeLine } from "react-icons/ri";
import { getRecentlyPlayed, getUserPlaylists, getTopArtists, SpotifyTrack, SpotifyArtist } from "@/lib/spotify";
import { LoadingState, ErrorState } from "./StatusStates";
import { TrackRow } from "./MusicRows";

export default function StatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTracks, setRecentTracks] = useState<{ played_at: string; track: SpotifyTrack }[]>([]);
  const [playlists, setPlaylists] = useState<{ items: { id: string; name: string; images: { url: string }[]; items?: { total: number }; tracks?: { total: number } | number | null }[] }>({ items: [] });
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [recentData, playlistsData, artistsData] = await Promise.all([
          getRecentlyPlayed(50),
          getUserPlaylists(20),
          getTopArtists("medium_term", 10),
        ]);
        setRecentTracks(recentData.items);
        setPlaylists(playlistsData);
        setTopArtists(artistsData.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const formatPlayedAt = (playedAt: string) => {
    const date = new Date(playedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalPlaylistTracks = playlists.items.reduce((acc, p) => {
    const tracks = p.items?.total || (typeof p.tracks === 'number' ? p.tracks : p.tracks?.total || 0);
    return acc + tracks;
  }, 0);

  const genreCounts: Record<string, number> = {};
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  const genreData = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count], _, arr) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
      count,
      percentage: Math.round((count / arr.reduce((s, [, c]) => s + c, 0)) * 100)
    }));

  const getColor = (index: number) => {
    const colors = [
      '#1DB954', // spotify green
      '#1ed760', // bright green
      '#b3b3b3', // light gray
      '#535353', // dark gray
      '#ffffff', // white
      '#ff6b6b', // coral red
    ];
    return colors[index % 6];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center">
          <RiBarChartFill className="text-3xl text-black" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">Your</p>
          <h1 className="text-3xl font-bold text-white">Stats</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Playlists</p>
          <p className="text-white text-xl font-bold">{playlists.items.length}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Tracks</p>
          <p className="text-white text-xl font-bold">{totalPlaylistTracks.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Recently Played</p>
          <p className="text-white text-xl font-bold">{recentTracks.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiTimeLine className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Recently Played</h2>
          </div>
          <div className="space-y-1">
            {recentTracks.slice(0, 10).map((item, index) => (
              <TrackRow 
                key={`${item.track.id}-${item.played_at}`} 
                track={item.track} 
                index={index}
                showPlayedAt={formatPlayedAt(item.played_at)}
              />
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartFill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Genres</h2>
          </div>
          {genreData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const displayGenres = genreData.slice(0, 6);
                    let currentAngle = 0;
                    return displayGenres.map((genre, i) => {
                      const sliceAngle = (genre.count / displayGenres.reduce((s, g) => s + g.count, 0)) * 100;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + sliceAngle;
                      const startRad = (startAngle / 100) * 2 * Math.PI;
                      const endRad = (endAngle / 100) * 2 * Math.PI;
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      const largeArc = sliceAngle > 50 ? 1 : 0;
                      currentAngle = endAngle;
                      return (
                        <path
                          key={genre.name}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          className="stroke-black stroke-[0.5]"
                          style={{ 
                            fill: getColor(i),
                            animation: `pieSlice 0.4s ease-out ${i * 0.15}s both`
                          }}
                        />
                      );
                    });
                  })()}
                  <circle cx="50" cy="50" r="25" className="fill-black" />
                </svg>
              </div>
              <div className="mt-4 w-full">
                {genreData.slice(0, 6).map((genre, i) => (
                  <div key={genre.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
                      <span className="text-zinc-300 text-sm truncate max-w-[150px]">{genre.name}</span>
                    </div>
                    <span className="text-zinc-500 text-sm">{genre.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-8">No genre data available</p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <RiHeartFill className="text-spotify-green" />
          <h2 className="text-xl font-bold text-white">Your Playlists</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.items.map((playlist) => (
            <div key={playlist.id} className="bg-zinc-800/30 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors">
              {playlist.images?.[0]?.url ? (
                <img src={playlist.images[0].url} alt={playlist.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full aspect-square bg-zinc-700 rounded-lg mb-2 flex items-center justify-center">
                  <RiMusic2Fill className="text-3xl text-zinc-500" />
                </div>
              )}
              <p className="text-white text-sm font-medium truncate">{playlist.name}</p>
              <p className="text-zinc-500 text-xs">{playlist.items?.total || (typeof playlist.tracks === 'number' ? playlist.tracks : playlist.tracks?.total || 0)} tracks</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
