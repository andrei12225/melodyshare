import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { toCurrentUser } from "@/lib/dto";
import FriendsPage from "@/components/FriendsPage";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsRoute() {
  const user = await requireUser();
  return <FriendsPage user={toCurrentUser(user)} />;
}
