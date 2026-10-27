import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { toCurrentUser } from "@/lib/dto";
import ChatPage from "@/components/ChatPage";

export const metadata: Metadata = { title: "Chat" };

// The chat UI lives in the layout so it stays mounted (friends list, open
// event stream) while switching between /chat and /chat/[friendId].
export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <ChatPage user={toCurrentUser(user)} />
      {children}
    </>
  );
}
