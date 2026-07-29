"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
  useIsSpeaking,
  useConnectionState,
  useTrackToggle,
} from "@livekit/components-react";
import {
  RoomEvent,
  Participant,
  Track,
  DisconnectReason,
  ConnectionState,
  RoomOptions,
} from "livekit-client";
import "@livekit/components-styles";
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Volume2,
  Radio,
  Shield,
  Activity,
  User as UserIcon,
  Check,
  AlertTriangle,
  Loader2,
  VolumeX,
} from "lucide-react";

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
};

interface WorkspaceVoiceCallProps {
  token: string;
  serverUrl: string;
  roomId: string;
  channelName?: string;
  onLeave: () => void;
  isHost?: boolean;
}

// 1. Real-time Event Listener to guarantee instant UI updates on any RoomEvent
function RoomEventSync() {
  const room = useRoomContext();
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!room) return;

    room.on(RoomEvent.ParticipantConnected, forceUpdate);
    room.on(RoomEvent.ParticipantDisconnected, forceUpdate);
    room.on(RoomEvent.TrackSubscribed, forceUpdate);
    room.on(RoomEvent.TrackUnsubscribed, forceUpdate);
    room.on(RoomEvent.ActiveSpeakersChanged, forceUpdate);
    room.on(RoomEvent.TrackMuted, forceUpdate);
    room.on(RoomEvent.TrackUnmuted, forceUpdate);

    return () => {
      room.off(RoomEvent.ParticipantConnected, forceUpdate);
      room.off(RoomEvent.ParticipantDisconnected, forceUpdate);
      room.off(RoomEvent.TrackSubscribed, forceUpdate);
      room.off(RoomEvent.TrackUnsubscribed, forceUpdate);
      room.off(RoomEvent.ActiveSpeakersChanged, forceUpdate);
      room.off(RoomEvent.TrackMuted, forceUpdate);
      room.off(RoomEvent.TrackUnmuted, forceUpdate);
    };
  }, [room, forceUpdate]);

  return null;
}

// 2. Header showing Workspace Voice Huddle title and live status
function VoiceCallHeader({
  channelName,
  roomId,
}: {
  channelName?: string;
  roomId: string;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();

  return (
    <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none px-2">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/60 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Voice Huddle
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700 mx-1" />
          <span className="text-sm font-semibold text-white tracking-wide">
            # {channelName || roomId}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-300">
            {participants.length} {participants.length === 1 ? "participant" : "participants"}
          </span>
        </div>
      </div>

      <div className="pointer-events-auto">
        {connectionState === ConnectionState.Connecting && (
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-lg text-amber-200 text-xs font-medium">
            <Loader2 size={13} className="animate-spin" />
            <span>Reconnecting audio...</span>
          </div>
        )}
        {connectionState === ConnectionState.Connected && (
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-lg text-emerald-300 text-xs font-medium">
            <Shield size={13} />
            <span>Encrypted Audio</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Circular Avatar Card with Active Speaker Ring & Mute Badges
function VoiceParticipantCard({ participant }: { participant: Participant }) {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = !participant.isMicrophoneEnabled;
  const displayName = participant.name || participant.identity || "Teammate";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 transition-all duration-300 group">
      {/* Circular Avatar with Active Speaker Glow Ring */}
      <div className="relative mb-4">
        <div
          className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl transition-all duration-300 relative ${
            isSpeaking
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 sm:ring-8 ring-emerald-500/70 shadow-[0_0_35px_rgba(16,185,129,0.7)] scale-105"
              : "bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 group-hover:border-slate-500"
          }`}
        >
          <span>{getInitials(displayName)}</span>

          {/* Mute / Speaking Badge overlay on bottom right of avatar */}
          <div
            className={`absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg transition-all duration-200 ${
              isMuted
                ? "bg-rose-500 text-white"
                : isSpeaking
                ? "bg-emerald-500 text-white animate-bounce"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {isMuted ? (
              <MicOff size={16} />
            ) : (
              <Mic size={16} className={isSpeaking ? "animate-pulse" : ""} />
            )}
          </div>
        </div>

        {/* Animated speaking sound waves under avatar when speaking */}
        {isSpeaking && (
          <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Full Name Badge */}
      <div className="flex items-center gap-2 max-w-[200px] bg-slate-900/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-700/50 shadow-md">
        <span className="text-sm font-semibold text-white truncate">
          {displayName}
        </span>
        {participant.isLocal && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            You
          </span>
        )}
      </div>

      {/* Speaking status label */}
      <span
        className={`text-xs mt-1.5 font-medium transition-opacity duration-200 ${
          isSpeaking
            ? "text-emerald-400 opacity-100"
            : isMuted
            ? "text-rose-400 opacity-80"
            : "text-slate-500 opacity-60"
        }`}
      >
        {isSpeaking ? "Speaking..." : isMuted ? "Muted" : "Listening"}
      </span>
    </div>
  );
}

// 4. Central Audio Tiles Grid with Google Meet Persistent Room Lifecycle
function VoiceTilesGrid() {
  const participants = useParticipants();

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center overflow-y-auto px-4 py-20">
      {/* If alone in the voice channel, display persistent badge without exiting */}
      {participants.length === 1 && (
        <div className="mb-6 flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/60 px-5 py-2.5 rounded-2xl shadow-xl text-slate-300 text-sm animate-in fade-in duration-300">
          <Activity size={16} className="text-emerald-400 animate-pulse" />
          <span>
            You&apos;re the only one in this voice room &mdash; waiting for teammates to join...
          </span>
        </div>
      )}

      {/* Responsive Grid for circular audio tiles */}
      <div
        className={`grid gap-4 sm:gap-8 max-w-6xl w-full justify-items-center items-center ${
          participants.length === 1
            ? "grid-cols-1"
            : participants.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : participants.length <= 4
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        }`}
      >
        {participants.map((p) => (
          <VoiceParticipantCard key={p.identity} participant={p} />
        ))}
      </div>
    </div>
  );
}

// 5. Audio Output Device Selector Dropdown Modal
function AudioOutputSelector({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  useEffect(() => {
    if (!isOpen) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((allDevices) => {
        const audioOutputs = allDevices.filter(
          (d) => d.kind === "audiooutput"
        );
        setDevices(audioOutputs);
      })
      .catch((err) =>
        console.error("Failed to enumerate audio devices:", err)
      );
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Volume2 size={16} className="text-emerald-400" />
          <span>Audio Output Device</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs"
        >
          Close
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {devices.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">
            Default system speaker active
          </p>
        ) : (
          devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() => {
                setSelectedDeviceId(device.deviceId);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                selectedDeviceId === device.deviceId
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="truncate pr-2">
                {device.label || `Speaker (${device.deviceId.slice(0, 6)})`}
              </span>
              {selectedDeviceId === device.deviceId && (
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// 6. Right-Hand Participant Sidebar (People Panel)
function VoiceSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const participants = useParticipants();

  if (!isOpen) return null;

  return (
    <div className="w-80 sm:w-88 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">
            People in Voice Room ({participants.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((p) => {
          const name = p.name || p.identity || "Teammate";
          const isMuted = !p.isMicrophoneEnabled;
          const isSpeaking = p.isSpeaking;

          return (
            <div
              key={p.identity}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                    isSpeaking
                      ? "bg-emerald-500 ring-2 ring-emerald-400"
                      : "bg-slate-700"
                  }`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {name}
                    </span>
                    {p.isLocal && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium block ${
                      isSpeaking
                        ? "text-emerald-400"
                        : isMuted
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {isSpeaking
                      ? "Speaking..."
                      : isMuted
                      ? "Muted"
                      : "Listening"}
                  </span>
                </div>
              </div>

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 7. Bottom Voice Control Toolbar
function VoiceToolbar({
  onLeave,
  sidebarOpen,
  onToggleSidebar,
}: {
  onLeave: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { toggle: toggleMic, enabled: isMicEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const participants = useParticipants();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-slate-700/60 shadow-2xl">
      {/* Microphone Toggle Button */}
      <button
        onClick={() => toggleMic()}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-md ${
          isMicEnabled
            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/50"
            : "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-rose-600/30"
        }`}
        title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicEnabled ? (
          <>
            <Mic size={18} className="text-emerald-400" />
            <span className="hidden sm:inline">Mute</span>
          </>
        ) : (
          <>
            <MicOff size={18} />
            <span className="hidden sm:inline">Unmute</span>
          </>
        )}
      </button>

      {/* Audio Output Selector Button */}
      <div className="relative">
        <button
          onClick={() => setShowDeviceSelector(!showDeviceSelector)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700/60 transition-colors"
          title="Audio Output Device"
        >
          <Volume2 size={18} className="text-slate-300" />
          <span className="hidden md:inline text-xs">Audio Out</span>
        </button>

        <AudioOutputSelector
          isOpen={showDeviceSelector}
          onClose={() => setShowDeviceSelector(false)}
        />
      </div>

      <div className="h-6 w-[1px] bg-slate-700 mx-1" />

      {/* Participant Sidebar Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors border ${
          sidebarOpen
            ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60"
        }`}
        title="Toggle People Sidebar"
      >
        <Users size={18} />
        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-200 font-bold">
          {participants.length}
        </span>
      </button>

      {/* Persistent Red Leave Call Button */}
      <button
        onClick={onLeave}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-rose-600/30 ml-2"
        title="Leave Voice Call"
      >
        <PhoneOff size={18} />
        <span>Leave Call</span>
      </button>
    </div>
  );
}

// 8. Main Exported WorkspaceVoiceCall Component
export function WorkspaceVoiceCall({
  token,
  serverUrl,
  roomId,
  channelName,
  onLeave,
  isHost,
}: WorkspaceVoiceCallProps) {
  // REQUIREMENT 1: Keep isCallActive strictly true until explicit disconnect or terminal reason
  const [isCallActive, setIsCallActive] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const handleDisconnect = useCallback(
    (reason?: DisconnectReason) => {
      console.log("[WorkspaceVoiceCall] Disconnected reason:", reason);
      if (
        reason === DisconnectReason.CLIENT_INITIATED ||
        reason === DisconnectReason.ROOM_DELETED ||
        reason === DisconnectReason.DUPLICATE_IDENTITY
      ) {
        setIsCallActive(false);
        onLeave();
      } else {
        console.warn(
          "[WorkspaceVoiceCall] Non-terminal disconnect reason:",
          reason,
          "- keeping voice call active for auto-reconnection."
        );
      }
    },
    [onLeave]
  );

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      options={roomOptions}
      token={token}
      serverUrl={serverUrl}
      connect={isCallActive}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onDisconnected={handleDisconnect}
      onError={(err) => {
        console.error("[WorkspaceVoiceCall] LiveKit Error:", err);
        setRoomError(err.message || "Voice connection error occurred.");
      }}
      className="font-sans"
    >
      <div className="flex h-screen w-full bg-slate-950 overflow-hidden relative select-none">
        {/* Real-time event synchronizer */}
        <RoomEventSync />

        {/* Top Huddle Header */}
        <VoiceCallHeader channelName={channelName} roomId={roomId} />

        {/* Central Google Meet style circular Audio Tiles Grid */}
        <div className="flex-1 flex flex-col items-center justify-center h-full relative">
          <VoiceTilesGrid />
        </div>

        {/* Right-Hand Sidebar (People / Participants in Room) */}
        <VoiceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Bottom Persistent Audio Toolbar */}
        <VoiceToolbar
          onLeave={() => {
            setIsCallActive(false);
            onLeave();
          }}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Mandatory RoomAudioRenderer so incoming audio plays automatically */}
        <RoomAudioRenderer />
      </div>
    </LiveKitRoom>
  );
}

export default WorkspaceVoiceCall;
