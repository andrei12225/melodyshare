"use client";

import { useEffect, useState } from "react";
import { RiBarChartFill, RiMusic2Fill } from "react-icons/ri";
import { getSpotifyProfile, getTopTracks, getTopArtists, getLikedSongs, getTimeRangeLabel, SpotifyProfile, SpotifyTrack, SpotifyArtist } from "@/lib/spotify";
import { LoadingState, ErrorState } from "./StatusStates";
import { TrackRow, ArtistCard } from "./MusicRows";
import Avatar from "./Avatar";

export default function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [likedSongsCount, setLikedSongsCount] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>("medium_term");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [profileData, tracksData, artistsData, likedData] = await Promise.all([
          getSpotifyProfile(),
          getTopTracks(timeRange, 10),
          getTopArtists(timeRange, 10),
          getLikedSongs(1),
        ]);
        setProfile(profileData);
        setTopTracks(tracksData.items);
        setTopArtists(artistsData.items);
        setLikedSongsCount(likedData.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const profileImage = profile?.images?.[0]?.url;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar url={profileImage} alt={profile?.display_name || "User"} size="xl" />
        <div>
          <p className="text-zinc-400 text-sm">Welcome back</p>
          <h1 className="text-3xl font-bold text-white">{profile?.display_name || "Spotify User"}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Top Artist</p>
          <p className="text-white text-xl font-bold truncate">{topArtists[0]?.name || "-"}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Top Track</p>
          <p className="text-white text-xl font-bold truncate">{topTracks[0]?.name || "-"}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Liked Songs</p>
          <p className="text-white text-xl font-bold">{likedSongsCount.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Time Range</p>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-700 text-white text-xl font-bold cursor-pointer rounded px-2 py-1 focus:outline-none"
          >
            <option value="short_term">4 Weeks</option>
            <option value="medium_term">6 Months</option>
            <option value="long_term">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartFill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Tracks</h2>
            <span className="text-zinc-500 text-sm">({getTimeRangeLabel(timeRange)})</span>
          </div>
          <div className="space-y-1">
            {topTracks.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} />
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiMusic2Fill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Artists</h2>
            <span className="text-zinc-500 text-sm">({getTimeRangeLabel(timeRange)})</span>
          </div>
          <div className="space-y-1">
            {topArtists.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
