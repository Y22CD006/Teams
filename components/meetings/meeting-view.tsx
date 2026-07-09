"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  Layers,
  Sparkles,
  ShieldAlert,
  Loader2,
  Hand,
  Copy,
} from "lucide-react";
import { User } from "@/lib/types";
import { useLiveKit } from "@/hooks/use-livekit";
import { VideoGrid } from "./video-grid";
import { CallControls } from "./call-controls";
import { ParticipantsPanel } from "./participants-panel";
import { MeetingChat } from "./meeting-chat";

interface MeetingViewProps {
  currentUser: User;
  meetingTitle: string;
  roomName: string;
  token: string;
  serverUrl: string;
  onLeave: () => void;
}

export const MeetingView = ({
  currentUser,
  meetingTitle,
  roomName,
  token,
  serverUrl,
  onLeave,
}: MeetingViewProps) => {
  const [viewLayout, setViewLayout] = useState<"grid" | "focus">("grid");
  const [raisedHand, setRaisedHand] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [volume, setVolume] = useState(80);

  const {
    isConnected,
    isConnecting,
    error,
    participants,
    activeSpeakers,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    localParticipant,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    disconnect,
    room,
  } = useLiveKit({
    url: serverUrl,
    token,
    roomName,
    onLeave,
  });

  useEffect(() => {
    if (!isConnected) return;
    const timer = setInterval(() => {
      setMeetingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected]);

  useEffect(() => {
    const vol = volume / 100;
    for (const p of participants) {
      for (const pub of p.audioTrackPublications.values()) {
        if (pub.track) {
          (pub.track as any).setVolume(vol);
        }
      }
    }
  }, [volume, participants]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLeaveCall = () => {
    disconnect();
    onLeave();
  };

  if (isConnecting) {
    return (
      <div className="flex-1 bg-[#090D16] flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm text-[var(--text-secondary)] font-semibold">
          Connecting to meeting room...
        </p>
        <p className="text-xs text-gray-500 mt-1 font-mono">{roomName}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#090D16] flex flex-col items-center justify-center h-full">
        <ShieldAlert className="w-10 h-10 text-rose-400 mb-4" />
        <p className="text-sm text-rose-400 font-semibold">Connection failed</p>
        <p className="text-xs text-gray-500 mt-1 max-w-md text-center">
          {error}
        </p>
        <button
          onClick={onLeave}
          className="mt-4 bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      id="immersive-meeting-canvas"
      className="flex-1 bg-[#090D16] flex flex-col h-full overflow-hidden select-none relative"
    >
      {/* Header */}
      <div className="h-14 border-b border-[var(--border-color)] px-5 flex items-center justify-between bg-[var(--bg-secondary)]/90 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] text-rose-400 font-bold font-mono tracking-wide uppercase">
                REC {formatTime(meetingTime)}
              </span>
            </div>
          )}
          <div className="h-4 w-[1px] bg-[#374151]" />
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate max-w-[200px]">
              {meetingTitle}
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
              {isConnected ? `${participants.length + 1} participant${participants.length !== 0 ? "s" : ""}` : "Connecting..."}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-indigo-300 font-semibold font-mono">
              Teams AI Noise Canceling Active
            </span>
          </div>
        )}

        {isConnected && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const link = `${window.location.origin}/meeting/${roomName}`;
                navigator.clipboard.writeText(link);
              }}
              className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-emerald-500/30 transition-all"
              title="Copy meeting invite link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <button
              onClick={() => setViewLayout("grid")}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === "grid"
                  ? "bg-[var(--bg-tertiary)] border-[#6366F1] text-[#6366F1]"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />{" "}
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewLayout("focus")}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === "focus"
                  ? "bg-[var(--bg-tertiary)] border-[#6366F1] text-[#6366F1]"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Focus View"
            >
              <Layers className="w-3.5 h-3.5" />{" "}
              <span className="hidden sm:inline">Focus</span>
            </button>
          </div>
        )}
      </div>

      {/* Video Area + Side Panels */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 relative flex items-center justify-center overflow-hidden">
          {isConnected ? (
            <VideoGrid
              participants={
                viewLayout === "focus"
                  ? participants.filter((p) =>
                      activeSpeakers.some((s) => s.identity === p.identity)
                    )
                  : participants
              }
              localParticipant={localParticipant}
              activeSpeakers={activeSpeakers}
              isScreenSharing={isScreenSharing}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[var(--text-secondary)]">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
              <p className="text-sm font-semibold">Waiting for connection...</p>
            </div>
          )}

          {raisedHand && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl animate-bounce z-40 text-xs border border-yellow-400">
              <Hand className="w-4 h-4 fill-black" />
              <span>{currentUser.name} Raised Hand</span>
            </div>
          )}
        </div>

        {showParticipants && isConnected && (
          <ParticipantsPanel
            roomName={roomName}
            participants={participants}
            localParticipant={localParticipant}
            adminUserId={currentUser.id}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {showChat && isConnected && (
          <MeetingChat
            room={room}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* Controls */}
      <CallControls
        isConnected={isConnected}
        isMicEnabled={isMicEnabled}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        raisedHand={raisedHand}
        volume={volume}
        showParticipants={showParticipants}
        showChat={showChat}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleRaiseHand={() => setRaisedHand(!raisedHand)}
        onToggleParticipants={() => {
          setShowParticipants((p) => !p);
          setShowChat(false);
        }}
        onToggleChat={() => {
          setShowChat((c) => !c);
          setShowParticipants(false);
        }}
        onVolumeChange={setVolume}
        onLeave={handleLeaveCall}
      />
    </div>
  );
}
