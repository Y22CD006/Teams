"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  PhoneOff,
  Users,
  MessageSquare,
  Volume2,
} from "lucide-react";

interface CallControlsProps {
  isConnected: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  raisedHand: boolean;
  volume: number;
  showParticipants: boolean;
  showChat: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onVolumeChange: (v: number) => void;
  onLeave: () => void;
}

export function CallControls({
  isConnected,
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing,
  raisedHand,
  volume,
  showParticipants,
  showChat,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRaiseHand,
  onToggleParticipants,
  onToggleChat,
  onVolumeChange,
  onLeave,
}: CallControlsProps) {
  return (
    <div className="h-20 border-t border-[var(--border-color)] px-6 bg-[var(--bg-secondary)] flex items-center justify-between flex-shrink-0 z-10">
      <div className="hidden sm:flex items-center gap-2.5">
        <button
          onClick={onToggleParticipants}
          className={`p-2 rounded-xl border transition-all ${
            showParticipants
              ? "bg-[#5B5FC7] text-white border-[#5B5FC7]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[#2e3748]"
          }`}
          title="Participants"
        >
          <Users className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={onToggleChat}
          className={`p-2 rounded-xl border transition-all ${
            showChat
              ? "bg-[#5B5FC7] text-white border-[#5B5FC7]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[#2e3748]"
          }`}
          title="Chat"
        >
          <MessageSquare className="w-4.5 h-4.5" />
        </button>
      </div>

      <div
        id="meeting-primary-controls-rail"
        className="flex items-center gap-2 sm:gap-3.5 mx-auto"
      >
        <button
          id="btn-toggle-mic"
          onClick={onToggleMic}
          disabled={!isConnected}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            isConnected ? "cursor-pointer" : "cursor-not-allowed opacity-40"
          } ${
            isMicEnabled
              ? "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[#2e3748]"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          }`}
          title={isMicEnabled ? "Mute Mic" : "Unmute Mic"}
        >
          {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          id="btn-toggle-camera"
          onClick={onToggleCamera}
          disabled={!isConnected}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            isConnected ? "cursor-pointer" : "cursor-not-allowed opacity-40"
          } ${
            isCameraEnabled
              ? "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[#2e3748]"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          }`}
          title={isCameraEnabled ? "Stop Camera" : "Start Camera"}
        >
          {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          id="btn-toggle-screenshare"
          onClick={onToggleScreenShare}
          disabled={!isConnected}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            isConnected ? "cursor-pointer" : "cursor-not-allowed opacity-40"
          } ${
            isScreenSharing
              ? "bg-indigo-500 text-white border-indigo-400 hover:bg-[#5053e1]"
              : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-indigo-400 hover:text-indigo-300 hover:bg-[#2e3748]"
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleRaiseHand}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
            raisedHand
              ? "bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-600"
              : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2e3748]"
          }`}
          title="Raise Hand"
        >
          <Hand className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-8 bg-[#374151] mx-1" />

        <button
          id="btn-hangup-call"
          onClick={onLeave}
          className="bg-rose-500 text-white px-5 py-3 rounded-2xl hover:bg-rose-600 transition-all font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
          title="Leave Meeting"
        >
          <PhoneOff className="w-4.5 h-4.5" />{" "}
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <Volume2 className="w-4.5 h-4.5 text-[var(--text-secondary)]" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-20 h-1 appearance-none bg-gray-700 rounded-full overflow-hidden cursor-pointer accent-[#6366F1]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6366F1] [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#6366F1] [&::-moz-range-thumb]:border-0"
          title={`Volume: ${volume}%`}
        />
      </div>
    </div>
  );
}
