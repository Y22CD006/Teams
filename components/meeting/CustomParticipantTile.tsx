"use client";

import { 
  TrackReferenceOrPlaceholder, 
  VideoTrack, 
  AudioTrack, 
  useIsSpeaking, 
  useTracks,
  isTrackReference 
} from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { Mic, MicOff, User, Activity } from "lucide-react";

interface CustomParticipantTileProps {
  participant?: Participant;
  trackRef?: TrackReferenceOrPlaceholder;
}

// Helper to generate consistent avatar background colors from name/identity
function getAvatarBgColor(nameOrIdentity: string): string {
  const colors = [
    "bg-indigo-600",
    "bg-blue-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-pink-600",
    "bg-amber-600",
    "bg-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < nameOrIdentity.length; i++) {
    hash = nameOrIdentity.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Helper to extract initials from full name or identity
function getInitials(nameOrIdentity: string): string {
  if (!nameOrIdentity) return "P";
  const parts = nameOrIdentity.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrIdentity.slice(0, 2).toUpperCase();
}

export default function CustomParticipantTile({ participant: propParticipant, trackRef }: CustomParticipantTileProps) {
  const participant = propParticipant || trackRef?.participant;
  if (!participant) return null;

  const isSpeaking = useIsSpeaking(participant);
  const isVideoEnabled = participant.isCameraEnabled;
  const isMicEnabled = participant.isMicrophoneEnabled;

  // Find camera track for this participant across all subscribed room camera tracks
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const myCameraTrackRef = cameraTracks.find(t => t.participant.identity === participant.identity);

  // Parse profile image from metadata if present
  let profileImage: string | null = null;
  try {
    const meta = participant.metadata ? JSON.parse(participant.metadata) : null;
    profileImage = meta?.profileImage || null;
  } catch (e) {
    // ignore parse error
  }

  const displayName = participant.name || participant.identity || "Participant";
  const initials = getInitials(displayName);
  const avatarBg = getAvatarBgColor(displayName);

  const hasVideoTrack = isVideoEnabled && myCameraTrackRef && isTrackReference(myCameraTrackRef);

  return (
    <div 
      className={`relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 shadow-xl transition-all duration-300 flex items-center justify-center ${
        isSpeaking 
          ? "border-2 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.35)] ring-1 ring-green-500/50" 
          : "border border-slate-800 hover:border-slate-700/80"
      }`}
    >
      {/* Video Stream (when Camera is enabled and track is published) */}
      {hasVideoTrack ? (
        <VideoTrack 
          trackRef={myCameraTrackRef as any} 
          className="w-full h-full object-cover rounded-2xl" 
        />
      ) : (
        /* Google Meet-style Fallback Avatar / Initials Tile */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 z-10 select-none">
          {/* Ambient background glow when speaking */}
          {isSpeaking && (
            <div className="absolute w-44 h-44 rounded-full bg-green-500/15 blur-2xl animate-pulse" />
          )}

          {/* Avatar Circle */}
          <div className="relative flex flex-col items-center justify-center">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={displayName} 
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl transition-all duration-300 ${
                  isSpeaking 
                    ? "ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.65)] scale-105" 
                    : "ring-2 ring-slate-700/80"
                }`} 
              />
            ) : (
              <div 
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ${avatarBg} flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  isSpeaking 
                    ? "ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.65)] scale-105" 
                    : "ring-2 ring-white/10"
                }`}
              >
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
                  {initials}
                </span>
              </div>
            )}

            {/* Speaking badge pill below avatar */}
            {isSpeaking && (
              <div className="mt-3 flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-xs font-semibold animate-pulse shadow-md">
                <Activity size={13} className="animate-bounce" />
                <span>Speaking</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Audio Track */}
      {trackRef && isTrackReference(trackRef) && <AudioTrack trackRef={trackRef as any} />}

      {/* Google Meet Style Name Overlay & Connection Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg max-w-[85%]">
        {/* Mic state icon */}
        {!isMicEnabled ? (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-sm" title="Microphone Muted">
            <MicOff size={13} />
          </div>
        ) : isSpeaking ? (
          <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center shrink-0 animate-pulse" title="Speaking">
            <Mic size={13} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-800/90 text-slate-300 flex items-center justify-center shrink-0" title="Microphone On">
            <Mic size={13} />
          </div>
        )}

        {/* Name and (You) badge */}
        <span className="text-sm font-semibold text-white truncate">
          {displayName}
        </span>
        {participant.isLocal && (
          <span className="text-xs font-normal text-slate-300 bg-white/15 px-2 py-0.5 rounded-md shrink-0">
            (You)
          </span>
        )}
      </div>

      {/* Connection indicator dot (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Connected</span>
      </div>
    </div>
  );
}
