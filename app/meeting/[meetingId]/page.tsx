"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function MeetingPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const meetingId = params.meetingId as string;

  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchToken() {
      if (!isLoaded || !isSignedIn || !meetingId) return;

      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          setError("Failed to get authentication token.");
          return;
        }

        const res = await fetch("http://localhost:4000/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clerkToken}`,
          },
          body: JSON.stringify({ roomName: meetingId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch meeting token");
        }

        const data = await res.json();
        setToken(data.token);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred.");
      }
    }

    fetchToken();
  }, [isLoaded, isSignedIn, meetingId, getToken]);

  if (!isLoaded || (!token && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p>Authenticating and preparing room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-white">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  if (!serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-white">
        <p className="text-red-500">Missing NEXT_PUBLIC_LIVEKIT_URL environment variable.</p>
      </div>
    );
  }

  return <MeetingRoom token={token} serverUrl={serverUrl} meetingId={meetingId} />;
}
