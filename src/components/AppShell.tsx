"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiHomeFill, RiBarChartFill, RiLogoutBoxFill, RiMusic2Fill, RiUser3Fill, RiChat3Fill, RiMenuLine, RiCloseLine } from "react-icons/ri";
import { apiFetch } from "@/lib/api-client";
import { useRealtimeEvent } from "@/lib/realtime";
import type { CurrentUser, FriendsResponse } from "@/lib/types";
import ToastContainer, { ToastMessage, ToastType } from "./ToastContainer";
import Avatar from "./Avatar";

interface SidebarProps {
  user: CurrentUser | null;
  pendingRequestsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

async function signOut() {
  await apiFetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

function Sidebar({ user, pendingRequestsCount, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen bg-black flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out border-r border-zinc-900 md:border-none
        w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <RiMusic2Fill className="text-4xl text-spotify-green" />
            <span className="text-2xl font-bold tracking-tight">MelodyShare</span>
          </div>
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white">
            <RiCloseLine size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarLink 
            icon={<RiHomeFill />} 
            text="Home" 
            href="/"
            active={isActive("/")} 
            onClick={onClose}
          />
          <SidebarLink 
            icon={<RiBarChartFill />} 
            text="Stats" 
            href="/stats"
            active={isActive("/stats")} 
            onClick={onClose}
            disabled={!user}
          />
          <SidebarLink 
            icon={<RiUser3Fill />} 
            text="Friends" 
            href="/friends"
            active={isActive("/friends")} 
            onClick={onClose}
            disabled={!user}
            badge={pendingRequestsCount > 0 ? pendingRequestsCount : undefined}
          />
          <SidebarLink 
            icon={<RiChat3Fill />} 
            text="Chat" 
            href="/chat"
            active={isActive("/chat")} 
            onClick={onClose}
            disabled={!user}
          />
        </nav>

        <div className={`mt-auto pt-6 ${user ? 'border-t border-zinc-800' : ''}`}>
          {user ? (
            <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg flex items-center gap-3 group relative cursor-help">
              <Avatar url={user.avatar_url} alt="Profile" size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.full_name || "User"}</p>
                <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 w-full mb-2 p-3 bg-zinc-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-zinc-700">
                <p className="text-xs text-zinc-400 mb-1">Signed in as</p>
                <p className="text-white text-sm font-bold truncate">{user.email || user.username}</p>
                <p className="text-xs text-zinc-500 mt-2">ID: {user.id.slice(0, 8)}...</p>
              </div>
            </div>
          ) : null}
          
          {user && (
            <button
              onClick={signOut}
              className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors py-2 w-full"
            >
              <RiLogoutBoxFill className="text-xl" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ icon, text, href, active = false, disabled = false, badge, onClick }: { icon: ReactNode; text: string; href: string; active?: boolean; disabled?: boolean; badge?: number; onClick?: () => void }) {
  const baseClasses = "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 relative";
  const activeClasses = "bg-zinc-900 text-white";
  const inactiveClasses = "text-zinc-400 hover:text-white hover:bg-zinc-900";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  const content = (
    <>
      {icon}
      <span className="font-medium">{text}</span>
      {badge ? (
        <span className="absolute right-4 bg-spotify-green text-black text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return <div className={`${baseClasses} ${inactiveClasses} ${disabledClasses}`}>{content}</div>;
  }

  return (
    <Link href={href} onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      {content}
    </Link>
  );
}

interface AppShellProps {
  user: CurrentUser | null;
  children: ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addToast = useCallback((title: string, message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { incoming } = await apiFetch<FriendsResponse>("/api/friends");
      setPendingRequestsCount(incoming.length);
    } catch (err) {
      console.error("Error fetching requests count:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useRealtimeEvent((event) => {
    if (event.type === "friend_request") {
      const senderName = event.from.full_name || event.from.username;
      addToast("New Friend Request", `${senderName} sent you a friend request!`, "success");
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }
    if (event.type === "friendships_changed" || event.type === "reconnected") {
      fetchPendingRequests();
    }
  }, !!user);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar 
        user={user} 
        pendingRequestsCount={pendingRequestsCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main className="md:ml-64 p-4 md:p-8 min-h-screen transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white">
                <RiMusic2Fill className="text-3xl text-spotify-green" />
                <span className="text-xl font-bold tracking-tight">MelodyShare</span>
            </div>
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="text-white p-2 hover:bg-zinc-900 rounded-lg transition-colors"
            >
                <RiMenuLine size={24} />
            </button>
        </div>

        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
