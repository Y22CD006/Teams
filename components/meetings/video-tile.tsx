"use client";

import { useRef, useEffect } from "react";
import {
  Participant,
  Track,
  ParticipantEvent,
} from "livekit-client";
import { MicOff, Volume2 } from "lucide-react";

interface VideoTileProps {
  participant: Participant;
  isSpeaking: boolean;
  isLocal?: boolean;
  className?: string;
}

export function VideoTile({
  participant,
  isSpeaking,
  isLocal,
  className = "",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const attachTracks = () => {
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.track) {
          try {
            pub.track.attach(el);
          } catch {}
        }
      }
    };

    const detachTracks = () => {
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.track) {
          try {
            pub.track.detach(el);
          } catch {}
        }
      }
    };

    attachTracks();

    const onTrackSubscribed = (track: Track) => {
      if (track.kind === "video") {
        try {
          track.attach(el);
        } catch {}
      }
    };

    const onTrackUnsubscribed = (track: Track) => {
      if (track.kind === "video") {
        try {
          track.detach(el);
        } catch {}
      }
    };

    const onTrackPublished = () => {
      attachTracks();
    };

    participant.on(ParticipantEvent.TrackSubscribed, onTrackSubscribed);
    participant.on(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed);
    participant.on(ParticipantEvent.LocalTrackPublished, onTrackPublished);

    return () => {
      detachTracks();
      participant.off(ParticipantEvent.TrackSubscribed, onTrackSubscribed);
      participant.off(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed);
      participant.off(ParticipantEvent.LocalTrackPublished, onTrackPublished);
    };
  }, [participant]);

  const hasVideo =
    participant.isCameraEnabled &&
    Array.from(participant.videoTrackPublications.values()).some(
      (pub) => pub.track
    );

  const displayName = participant.name || participant.identity || "Unknown";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative rounded-2xl border bg-[var(--bg-secondary)] overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
        isSpeaking
          ? "border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.01] shadow-emerald-950/20"
          : "border-[var(--border-color)] hover:border-gray-500"
      } ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
          hasVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 bg-[var(--bg-primary)] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-lg font-bold">
            {initials}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            Camera Off
          </span>
        </div>
      )}

      {/* Mic status badge */}
      {!participant.isMicrophoneEnabled && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5 z-10">
          <MicOff className="w-3.5 h-3.5 text-rose-400" />
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute left-4 top-4 bg-emerald-500 text-black px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow font-mono animate-pulse">
          <Volume2 className="w-3 h-3" /> Speaking
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white font-semibold flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {displayName}
        {isLocal && " (You)"}
      </div>
    </div>
  );
}
