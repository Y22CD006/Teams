"use client";

import { useParticipants, useIsSpeaking } from "@livekit/components-react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  User as UserIcon, 
  UserMinus, 
  MicOff as ForceMicOff, 
  MonitorOff, 
  Search,
  X,
  Users,
  Activity,
  ShieldAlert
} from "lucide-react";
import { Participant, Track } from "livekit-client";
import { useState } from "react";

interface MeetingParticipantsProps {
  isHost?: boolean;
  meetingId?: string;
  onClose?: () => void;
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

function getInitials(nameOrIdentity: string): string {
  if (!nameOrIdentity) return "P";
  const parts = nameOrIdentity.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrIdentity.slice(0, 2).toUpperCase();
}

export default function MeetingParticipants({ isHost, meetingId, onClose }: MeetingParticipantsProps) {
  const participants = useParticipants();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = participants.filter((p: Participant) => {
    const name = (p.name || p.identity || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleModerate = async (action: 'mute' | 'remove', identity: string, trackSid?: string) => {
    if (!meetingId) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, identity, trackSid })
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Moderation failed: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to moderate participant");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 text-white select-none">
      {/* Header with real-time count badge & close button */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users size={18} />
          </div>
          <h2 className="text-base font-semibold tracking-wide text-white flex items-center gap-2">
            <span>People</span>
            <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              People ({participants.length})
            </span>
          </h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search / Filter box */}
      <div className="p-3 border-b border-slate-800/60">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Section Subheader */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
        <span>In Meeting</span>
        <span>{filteredParticipants.length} connected</span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No participants found matching "{searchQuery}"
          </div>
        ) : (
          filteredParticipants.map((participant: Participant) => (
            <ParticipantListItem 
              key={participant.identity} 
              participant={participant} 
              isHost={isHost} 
              handleModerate={handleModerate} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function ParticipantListItem({ 
  participant, 
  isHost, 
  handleModerate 
}: { 
  participant: Participant; 
  isHost?: boolean; 
  handleModerate: (action: 'mute' | 'remove', identity: string, trackSid?: string) => void;
}) {
  const isSpeaking = useIsSpeaking(participant);

  let profileImage: string | null = null;
  try {
    const meta = participant.metadata ? JSON.parse(participant.metadata) : null;
    profileImage = meta?.profileImage || null;
  } catch (e) {}

  const isMicEnabled = participant.isMicrophoneEnabled;
  const isCamEnabled = participant.isCameraEnabled;
  const isScreenSharing = participant.isScreenShareEnabled;

  const displayName = participant.name || participant.identity || "Unknown";
  const initials = getInitials(displayName);
  const avatarBg = getAvatarBgColor(displayName);

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
        isSpeaking 
          ? "bg-slate-800/90 border border-green-500/40 shadow-md" 
          : "hover:bg-slate-800/60 border border-transparent"
      }`}
    >
      {/* User Info */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        <div className="flex-shrink-0 relative">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={displayName} 
              className={`w-10 h-10 rounded-full object-cover transition-all duration-300 ${
                isSpeaking 
                  ? "ring-2 ring-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)] scale-105" 
                  : "ring-1 ring-slate-700"
              }`} 
            />
          ) : (
            <div 
              className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center transition-all duration-300 ${
                isSpeaking 
                  ? "ring-2 ring-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)] scale-105" 
                  : "ring-1 ring-white/10"
              }`}
            >
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          )}

          {/* Speaking ring pulse overlay */}
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center animate-pulse" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm font-semibold text-white truncate">
              {displayName}
            </span>
            {participant.isLocal && (
              <span className="text-[11px] text-slate-300 font-medium bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                (You)
              </span>
            )}
          </div>

          {isSpeaking ? (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <Activity size={11} className="animate-bounce" />
              <span>Speaking...</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Connected</span>
            </span>
          )}
        </div>
      </div>

      {/* Real-time Status Icons (Mic / Camera / Screen Share / Moderation) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Screen share indicator */}
        {isScreenSharing && (
          <div className="flex items-center group">
            <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg" title="Sharing Screen">
              <MonitorUp size={15} />
            </div>
            {isHost && !participant.isLocal && (
              <button 
                onClick={() => {
                  const pub = participant.getTrackPublication(Track.Source.ScreenShare);
                  if (pub?.trackSid) handleModerate('mute', participant.identity, pub.trackSid);
                }}
                className="hidden group-hover:flex ml-1 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                title="Stop Screen Share"
              >
                <MonitorOff size={15} />
              </button>
            )}
          </div>
        )}

        {/* Camera state icon */}
        <div 
          className={`p-1.5 rounded-lg transition-colors ${
            isCamEnabled 
              ? "text-slate-300 bg-slate-800/60" 
              : "text-red-400 bg-red-500/15 border border-red-500/20"
          }`} 
          title={isCamEnabled ? "Camera On" : "Camera Off"}
        >
          {isCamEnabled ? <Video size={15} /> : <VideoOff size={15} />}
        </div>

        {/* Mic state icon */}
        <div className="flex items-center group">
          <div 
            className={`p-1.5 rounded-lg transition-colors ${
              isMicEnabled 
                ? isSpeaking
                  ? "text-green-400 bg-green-500/20 border border-green-500/30"
                  : "text-slate-300 bg-slate-800/60" 
                : "text-red-400 bg-red-500/15 border border-red-500/20"
            }`} 
            title={isMicEnabled ? (isSpeaking ? "Speaking" : "Microphone On") : "Microphone Off"}
          >
            {isMicEnabled ? <Mic size={15} /> : <MicOff size={15} />}
          </div>

          {/* Host Force Mute */}
          {isHost && !participant.isLocal && isMicEnabled && (
            <button 
              onClick={() => {
                const pub = participant.getTrackPublication(Track.Source.Microphone);
                if (pub?.trackSid) handleModerate('mute', participant.identity, pub.trackSid);
              }}
              className="hidden group-hover:flex ml-1 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              title="Force Mute Microphone"
            >
              <ForceMicOff size={15} />
            </button>
          )}
        </div>

        {/* Host Remove Participant */}
        {isHost && !participant.isLocal && (
          <button 
            onClick={() => {
              if (confirm(`Are you sure you want to remove ${displayName} from the meeting?`)) {
                handleModerate('remove', participant.identity);
              }
            }}
            className="p-1.5 bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors ml-0.5"
            title="Remove Participant from Meeting"
          >
            <UserMinus size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
