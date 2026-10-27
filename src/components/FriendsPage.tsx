"use client";

import { useState, useEffect, useCallback } from "react";
import { RiUserAddFill, RiUserReceivedFill, RiCheckFill, RiCloseFill, RiSearchLine, RiUser3Fill, RiUserUnfollowFill } from "react-icons/ri";
import ConfirmationModal from "./ConfirmationModal";
import Avatar from "./Avatar";
import { apiFetch } from "@/lib/api-client";
import { useRealtimeEvent } from "@/lib/realtime";
import type { CurrentUser, FriendRequest, FriendsResponse, Profile } from "@/lib/types";

export default function FriendsPage({ user }: { user: CurrentUser }) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Profile | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "info" } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertState({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setSearchLoading(true);
    try {
      const data = await apiFetch<Profile[]>(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchFriendsAndRequests = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { friends, incoming } = await apiFetch<FriendsResponse>("/api/friends");
      setFriends(friends);
      setIncomingRequests(incoming);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [user.id, fetchFriendsAndRequests]);

  useRealtimeEvent((event) => {
    if (event.type === "friendships_changed" || event.type === "reconnected") {
      fetchFriendsAndRequests(true);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by useEffect on searchTerm change
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await apiFetch("/api/friends/requests", { method: "POST", body: JSON.stringify({ userId }) });
      showAlert("Success", "Friend request sent!", "success");
      setSearchResults([]); // Clear search to avoid spamming
      setSearchTerm("");
    } catch (error) {
      console.error("Error sending friend request:", error);
      showAlert("Error", error instanceof Error ? error.message : "Failed to send request.", "error");
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      await apiFetch(`/api/friends/requests/${friendshipId}`, { method: "PATCH" });
      fetchFriendsAndRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    try {
      await apiFetch(`/api/friends/requests/${friendshipId}`, { method: "DELETE" });
      fetchFriendsAndRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleRemoveFriendClick = (friend: Profile) => {
    setFriendToRemove(friend);
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    
    try {
      await apiFetch(`/api/friends/${friendToRemove.id}`, { method: "DELETE" });

      // Manually update local state to reflect removal immediately
      setFriends(prev => prev.filter(f => f.id !== friendToRemove.id));
      fetchFriendsAndRequests(); // Full refresh to be safe
    } catch (error) {
      console.error("Error removing friend:", error);
      showAlert("Error", "Failed to remove friend", "error");
    } finally {
      setFriendToRemove(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ConfirmationModal
        isOpen={!!friendToRemove}
        onClose={() => setFriendToRemove(null)}
        onConfirm={confirmRemoveFriend}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friendToRemove?.full_name || friendToRemove?.username} from your friends list? This action cannot be undone.`}
        confirmText="Remove"
        confirmColor="red"
      />

      {/* Alert Modal */}
      <ConfirmationModal
        isOpen={!!alertState?.isOpen}
        onClose={() => setAlertState(null)}
        title={alertState?.title || ""}
        message={alertState?.message || ""}
        confirmText="OK"
        cancelText={null}
        confirmColor={alertState?.type === "error" ? "red" : "green"}
      />

      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-spotify-green rounded-full flex items-center justify-center">
          <RiUser3Fill className="text-2xl md:text-3xl text-black" />
        </div>
        <div>
          <p className="text-zinc-400 text-xs md:text-sm">Your</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Friends</h1>
        </div>
      </div>

      {/* Friend Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUserReceivedFill className="text-spotify-green" />
            Friend Requests
          </h2>
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-800/50 p-3 md:p-4 rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <Avatar url={request.sender.avatar_url} alt={request.sender.username || "User"} size="md" />
                  <div>
                    <p className="text-white font-medium">{request.sender.full_name || request.sender.username}</p>
                    <p className="text-zinc-500 text-xs">@{request.sender.username}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => acceptRequest(request.id)}
                    className="flex-1 sm:flex-none p-2 bg-spotify-green text-black rounded-full hover:scale-105 transition-transform flex justify-center"
                    title="Accept"
                  >
                    <RiCheckFill />
                  </button>
                  <button 
                    onClick={() => rejectRequest(request.id)}
                    className="flex-1 sm:flex-none p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/30 transition-colors flex justify-center"
                    title="Reject"
                  >
                    <RiCloseFill />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Friends List */}
        <div className="bg-zinc-900/50 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUser3Fill className="text-spotify-green" />
            Your Friends ({friends.length})
          </h2>
          {loading ? (
             <p className="text-zinc-500">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="text-zinc-500">No friends yet. Add some!</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar url={friend.avatar_url} alt={friend.username || "User"} size="md" />
                    <div>
                      <p className="text-white font-medium">{friend.full_name || friend.username}</p>
                      <p className="text-zinc-500 text-xs">@{friend.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriendClick(friend)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Friend"
                  >
                    <RiUserUnfollowFill />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Friend */}
        <div className="bg-zinc-900/50 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUserAddFill className="text-spotify-green" />
            Add Friend
          </h2>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-spotify-green transition-colors"
              />
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
            {/* Removed Search button as it's now live search */}
          </form>

          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar url={user.avatar_url} alt={user.full_name || user.username} size="sm" />
                  <p className="text-white text-sm font-medium">{user.full_name || user.username}</p>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="text-xs bg-spotify-green text-black px-3 py-1 rounded-full hover:scale-105 transition-transform"
                >
                  Add
                </button>
              </div>
            ))}
            {searchResults.length === 0 && searchTerm && !searchLoading && (
              <p className="text-zinc-500 text-center text-sm">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
