import { RiMusic2Fill } from "react-icons/ri";
import { formatDuration, SpotifyArtist, SpotifyTrack } from "@/lib/spotify";
import Avatar from "./Avatar";

export function TrackRow({ track, index, showPlayedAt }: { track: SpotifyTrack; index: number; showPlayedAt?: string }) {
  const albumImage = track.album?.images?.[0]?.url;
  const artistNames = track.artists?.map((a) => a.name).join(", ") || "Unknown Artist";

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors group">
      <span className="text-zinc-500 w-6 text-center">{index + 1}</span>
      {albumImage ? (
        <img src={albumImage} alt={track.album?.name || "Album"} className="w-12 h-12 rounded" />
      ) : (
        <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
          <RiMusic2Fill className="text-zinc-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{track.name}</p>
        <p className="text-zinc-400 text-sm truncate">{artistNames}</p>
      </div>
      {showPlayedAt && (
        <span className="text-zinc-500 text-sm">{showPlayedAt}</span>
      )}
      <span className="text-zinc-500 text-sm">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}

export function ArtistCard({ artist, index }: { artist: SpotifyArtist; index: number }) {

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors">
      <span className="text-zinc-500 w-6 text-center">{index + 1}</span>
      <Avatar url={artist.images?.[0]?.url} alt={artist.name} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{artist.name}</p>
        {artist.genres?.[0] && (
          <p className="text-zinc-400 text-sm truncate">{artist.genres[0]}</p>
        )}
      </div>
    </div>
  );
}
