"use client";

import MeetingRoom from "@/components/meeting/MeetingRoom";
import type { User } from "@/lib/types";

interface MeetingViewWrapperProps {
  user: User;
  roomName: string;
  token: string;
  serverUrl: string;
}

export function MeetingViewWrapper({ user, roomName, token, serverUrl }: MeetingViewWrapperProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      <MeetingRoom
        token={token}
        serverUrl={serverUrl}
        meetingId={roomName}
      />
    </div>
  );
}
