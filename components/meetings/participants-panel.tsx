"use client";

import { useState } from "react";
import { Participant, LocalParticipant } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  LogOut,
  X,
  Loader2,
} from "lucide-react";

interface ParticipantsPanelProps {
  roomName: string;
  participants: Participant[];
  localParticipant: LocalParticipant | null;
  adminUserId: string;
  onClose: () => void;
}

export function ParticipantsPanel({
  roomName,
  participants,
  localParticipant,
  adminUserId,
  onClose,
}: ParticipantsPanelProps) {
  const [kickingId, setKickingId] = useState<string | null>(null);

  const allParticipants = [
    ...(localParticipant
      ? [{ participant: localParticipant as Participant, isLocal: true }]
      : []),
    ...participants.map((p) => ({ participant: p, isLocal: false })),
  ];

  const handleKick = async (identity: string) => {
    setKickingId(identity);
    try {
      await fetch("/api/livekit/remove-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, participantIdentity: identity }),
      });
    } catch (e) {
      console.error("kick failed:", e);
    }
    setKickingId(null);
  };

  return (
    <div className="w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-color)] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Participants ({allParticipants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allParticipants.map(({ participant, isLocal }) => {
          const isAdmin = participant.identity === adminUserId;
          const isKicking = kickingId === participant.identity;
          const name = participant.name || participant.identity || "Unknown";

          return (
            <div
              key={participant.identity}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[var(--text-primary)] font-medium truncate">
                    {name}
                    {isLocal && (
                      <span className="text-[var(--text-secondary)] font-normal ml-1">
                        (You)
                      </span>
                    )}
                  </span>
                  {isAdmin && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {participant.isMicrophoneEnabled ? (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                {participant.isCameraEnabled ? (
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>

              {isAdmin && !isLocal && (
                <button
                  onClick={() => handleKick(participant.identity)}
                  disabled={isKicking}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 transition-all disabled:opacity-50"
                  title="Remove from meeting"
                >
                  {isKicking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
