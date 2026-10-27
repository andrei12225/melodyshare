import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { toCurrentUser } from "@/lib/dto";
import AppShell from "@/components/AppShell";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: { default: "MelodyShare", template: "%s · MelodyShare" },
  description: "Your Spotify listening stats, shared with friends",
  icons: { icon: "/music-note.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <AppShell user={user ? toCurrentUser(user) : null}>{children}</AppShell>
      </body>
    </html>
  );
}
