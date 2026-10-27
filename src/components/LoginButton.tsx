"use client";

import { useState } from "react";
import { FaSpotify } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";

export default function LoginButton() {
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  return (
    <>
      <ConfirmationModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        onConfirm={() => {
          window.location.href = "/api/auth/login";
        }}
        title="Limited access"
        message="MelodyShare is running in Spotify's development mode, so Spotify only allows accounts that have been added to the app's allowlist to sign in. If your account isn't on the list, the login will fail. Ask the app owner to add you."
        confirmText="Continue to Spotify"
        confirmColor="green"
      />
      <button
        onClick={() => setIsWarningOpen(true)}
        className="bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-200 hover:scale-105"
      >
        <FaSpotify className="text-xl" />
        <span>Connect with Spotify</span>
      </button>
    </>
  );
}
