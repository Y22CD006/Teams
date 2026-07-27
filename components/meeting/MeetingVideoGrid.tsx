"use client";

import { useParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import { Users, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import CustomParticipantTile from "./CustomParticipantTile";

interface MeetingVideoGridProps {
  meetingId?: string;
}

export default function MeetingVideoGrid({ meetingId }: MeetingVideoGridProps) {
  const participants = useParticipants();
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const [copied, setCopied] = useState(false);

  const totalTiles = participants.length + screenShareTracks.length;

  // Determine dynamic Google Meet style grid columns based on active count
  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1 grid-rows-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 grid-rows-1 max-w-6xl mx-auto";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2 grid-rows-2 max-w-7xl mx-auto";
    if (count <= 6) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid-rows-2 max-w-7xl mx-auto";
    if (count <= 9) return "grid-cols-1 sm:grid-cols-3 md:grid-cols-3 grid-rows-3";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Waiting for others banner when only local participant is connected */}
      {participants.length === 1 && (
        <div className="mb-4 flex items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md max-w-md w-full animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Waiting for others to join...</p>
              <p className="text-[11px] text-slate-400">You're the only one in the room right now</p>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0 shadow-md"
          >
            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      )}

      {/* Dynamic Video Grid Stage */}
      <div 
        className={`w-full h-full grid gap-3 sm:gap-4 transition-all duration-300 ${getGridClass(totalTiles)} items-center justify-center`}
      >
        {/* Render Screen Share Tracks First (larger priority) */}
        {screenShareTracks.map((screenTrack) => (
          <div 
            key={screenTrack.publication.trackSid || screenTrack.participant.identity + "_screen"} 
            className="relative w-full h-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-2xl md:col-span-2"
          >
            <VideoTrack trackRef={screenTrack as any} className="w-full h-full object-contain bg-black" />
            <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 flex items-center gap-2 border border-blue-500/30">
              <Share2 size={14} />
              <span>{screenTrack.participant.name || screenTrack.participant.identity}'s Screen</span>
            </div>
          </div>
        ))}

        {/* Render Every Single Connected Participant Tile */}
        {participants.map((participant: Participant) => (
          <div key={participant.identity} className="w-full h-full flex items-center justify-center">
            <CustomParticipantTile participant={participant} />
          </div>
        ))}
      </div>
    </div>
  );
}
