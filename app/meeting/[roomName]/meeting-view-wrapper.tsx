"use client";

import { MeetingView } from "@/components/meetings/meeting-view";
import type { User } from "@/lib/types";

interface MeetingViewWrapperProps {
  user: User;
  roomName: string;
  token: string;
  serverUrl: string;
}

export function MeetingViewWrapper({ user, roomName, token, serverUrl }: MeetingViewWrapperProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090D16]">
      <MeetingView
        currentUser={user}
        meetingTitle={`Meeting: ${roomName}`}
        roomName={roomName}
        token={token}
        serverUrl={serverUrl}
        onLeave={() => window.location.href = "/"}
      />
    </div>
  );
}
