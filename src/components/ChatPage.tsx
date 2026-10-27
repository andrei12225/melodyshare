"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RiChat3Fill, RiSendPlaneFill, RiMusic2Fill, RiDeleteBinLine, RiArrowLeftLine } from "react-icons/ri";
import { FaSpotify } from "react-icons/fa";
import Avatar from "./Avatar";
import SongSearchModal from "./SongSearchModal";
import ConfirmationModal from "./ConfirmationModal";
import { SpotifyTrack } from "@/lib/spotify";
import { apiFetch } from "@/lib/api-client";
import { useRealtimeEvent } from "@/lib/realtime";
import type { CurrentUser, FriendsResponse, Message, Profile } from "@/lib/types";

const SONG_PREFIX = "SONG_SHARE::";

export default function ChatPage({ user }: { user: CurrentUser }) {
  const [friends, setFriends] = useState<Profile[]>([]);
  // The open conversation comes from the URL: /chat/[friendId]
  const { friendId } = useParams<{ friendId?: string }>();
  const selectedFriendId = friendId ?? null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null;

  const selectedFriendIdRef = useRef<string | null>(null);
  selectedFriendIdRef.current = selectedFriendId;

  const fetchFriends = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { friends } = await apiFetch<FriendsResponse>("/api/friends");
      setFriends(friends);
    } catch (error) {
      console.error("Error fetching friends for chat:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (friendId: string) => {
    try {
      const data = await apiFetch<Message[]>(`/api/messages?with=${friendId}`);
      // Ignore the response if the user switched conversations in the meantime
      if (selectedFriendIdRef.current === friendId) setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const addMessage = (message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  useEffect(() => {
    fetchFriends();
  }, [user.id, fetchFriends]);

  useEffect(() => {
    setMessages([]);
    if (selectedFriendId) fetchMessages(selectedFriendId);
  }, [selectedFriendId, fetchMessages]);

  useRealtimeEvent((event) => {
    if (event.type === "message") {
      const { sender_id, receiver_id } = event.message;
      const otherId = sender_id === user.id ? receiver_id : sender_id;
      if (otherId === selectedFriendId) addMessage(event.message);
    } else if (event.type === "message_deleted") {
      setMessages((prev) => prev.filter((msg) => msg.id !== event.id));
    } else if (event.type === "friendships_changed") {
      fetchFriends(true);
    } else if (event.type === "reconnected") {
      fetchFriends(true);
      if (selectedFriendId) fetchMessages(selectedFriendId);
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const postMessage = async (content: string) => {
    if (!selectedFriend) return;
    const message = await apiFetch<Message>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: selectedFriend.id, content }),
    });
    addMessage(message);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    const msgContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    try {
      await postMessage(msgContent);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
      setNewMessage(msgContent); // Restore on failure
    }
  };

  const handleSendSong = async (track: SpotifyTrack) => {
    if (!selectedFriend) return;

    const songData = {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      image: track.album.images[0]?.url,
      uri: `https://open.spotify.com/track/${track.id}`
    };

    const msgContent = `${SONG_PREFIX}${JSON.stringify(songData)}`;
    
    try {
      await postMessage(msgContent);
    } catch (error) {
      console.error("Error sending song:", error);
      alert("Failed to send song");
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    const messageId = messageToDelete;
    setMessageToDelete(null); // Close modal

    // Optimistic update
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    try {
      await apiFetch(`/api/messages/${messageId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. You may not have permission.");
      // Revert optimistic update by refetching
      if (selectedFriend) fetchMessages(selectedFriend.id);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4">
      <SongSearchModal 
        isOpen={isSongModalOpen} 
        onClose={() => setIsSongModalOpen(false)} 
        onSelect={handleSendSong}
      />
      
      <ConfirmationModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />

      {/* Sidebar: Friends List */}
      <div className={`
        w-full md:w-1/3 bg-zinc-900/50 rounded-xl p-4 flex flex-col h-full
        ${selectedFriendId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="flex items-center gap-2 mb-4">
          <RiChat3Fill className="text-spotify-green text-xl" />
          <h2 className="text-xl font-bold text-white">Chats</h2>
        </div>
        
        {loading ? (
          <p className="text-zinc-500 text-sm">Loading contacts...</p>
        ) : friends.length === 0 ? (
          <p className="text-zinc-500 text-sm">No friends yet. Add some in the Friends tab!</p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {friends.map((friend) => (
              <Link 
                key={friend.id}
                href={`/chat/${friend.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedFriendId === friend.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
              >
                <div className="relative">
                  <Avatar url={friend.avatar_url} alt={friend.username || "User"} size="md" />
                  {/* Online status indicator could go here */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{friend.full_name || friend.username}</p>
                  <p className="text-zinc-500 text-xs truncate">@{friend.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`
        flex-1 bg-zinc-900/50 rounded-xl flex-col overflow-hidden h-full
        ${selectedFriendId ? 'flex' : 'hidden md:flex'}
      `}>
        {selectedFriend ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <Link 
                href="/chat"
                className="md:hidden text-zinc-400 hover:text-white mr-2"
              >
                <RiArrowLeftLine size={24} />
              </Link>
              <Avatar url={selectedFriend.avatar_url} alt={selectedFriend.username || "User"} size="sm" />
              <h2 className="text-white font-bold">{selectedFriend.full_name || selectedFriend.username}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                
                const isSong = msg.content.startsWith(SONG_PREFIX);
                let songData = null;
                if (isSong) {
                    try {
                        songData = JSON.parse(msg.content.substring(SONG_PREFIX.length));
                    } catch (e) {}
                }

                return (
                  <div key={msg.id} className={`group flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} items-center`}>
                    {isMe && (
                      <button
                        onClick={() => setMessageToDelete(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity p-2 cursor-pointer"
                        title="Delete message"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    )}
                    {!isMe && (
                      <div className="flex-shrink-0 self-end">
                         <Avatar url={selectedFriend.avatar_url} size="xs" />
                      </div>
                    )}
                    
                    {songData ? (
                        // Song Card
                        <div className={`max-w-[300px] w-full p-3 rounded-2xl ${isMe ? 'bg-spotify-green text-black rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
                            <div className="flex gap-3 items-center mb-2">
                                <img src={songData.image} alt={songData.name} className="w-16 h-16 rounded shadow-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate text-sm">{songData.name}</p>
                                    <p className={`text-xs truncate ${isMe ? 'text-black/70' : 'text-zinc-400'}`}>{songData.artist}</p>
                                </div>
                            </div>
                            <a 
                                href={`https://open.spotify.com/track/${encodeURIComponent(songData.id)}`}
                                target="_blank" 
                                rel="noreferrer"
                                className={`flex items-center justify-center gap-2 w-full py-2 rounded-full text-xs font-bold transition-colors ${
                                    isMe 
                                    ? 'bg-black/10 hover:bg-black/20 text-black' 
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                }`}
                            >
                                <FaSpotify /> Play on Spotify
                            </a>
                             <p className={`text-[10px] mt-2 text-right ${isMe ? 'text-black/60' : 'text-zinc-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                        </div>
                    ) : (
                        // Text Message
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${isMe ? 'bg-spotify-green text-black rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-zinc-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsSongModalOpen(true)}
                    className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-spotify-green rounded-full flex items-center justify-center transition-colors"
                    title="Share Song"
                >
                    <RiMusic2Fill size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-spotify-green focus:outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  <RiSendPlaneFill />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <RiChat3Fill className="text-4xl mb-4 opacity-50" />
            {!selectedFriendId ? (
              <p>Select a friend to start chatting</p>
            ) : loading ? (
              <p>Loading conversation...</p>
            ) : (
              <>
                <p>This conversation isn&apos;t available.</p>
                <Link href="/chat" className="text-spotify-green text-sm mt-2 hover:underline">Back to chats</Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
