import { RiLoader4Line } from "react-icons/ri";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <RiLoader4Line className="text-4xl text-spotify-green animate-spin mb-4" />
      <p className="text-zinc-400">Loading...</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-900/20 border border-red-900 rounded-xl p-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}
