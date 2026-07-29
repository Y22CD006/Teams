"use client";

import { useTrackToggle, DisconnectButton, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  MessageSquare, 
  Users, 
  Settings, 
  PhoneOff, 
  Circle, 
  Square, 
  Trash2 
} from "lucide-react";

interface TeamsControlBarProps {
  activeTab: 'chat' | 'participants' | null;
  setActiveTab: (tab: 'chat' | 'participants' | null) => void;
  isHost?: boolean;
  isRecording?: boolean;
  onToggleRecord?: () => void;
  meetingId?: string;
}

const MicToggle = () => {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Microphone });
  return (
    <button 
      onClick={() => toggle()} 
      className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
        enabled 
          ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/60" 
          : "bg-red-500 hover:bg-red-600 text-white border border-red-400 shadow-red-500/20"
      }`}
      title={enabled ? "Turn off microphone" : "Turn on microphone"}
    >
      {enabled ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
};

const CamToggle = () => {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Camera });
  return (
    <button 
      onClick={() => toggle()} 
      className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
        enabled 
          ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/60" 
          : "bg-red-500 hover:bg-red-600 text-white border border-red-400 shadow-red-500/20"
      }`}
      title={enabled ? "Turn off camera" : "Turn on camera"}
    >
      {enabled ? <Video size={20} /> : <VideoOff size={20} />}
    </button>
  );
};

const ScreenShareToggle = () => {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });
  return (
    <button 
      onClick={() => toggle()} 
      className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
        enabled 
          ? "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-500/30" 
          : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
      }`}
      title={enabled ? "Stop screen sharing" : "Share screen"}
    >
      <MonitorUp size={20} />
    </button>
  );
};

export default function TeamsControlBar({ 
  activeTab, 
  setActiveTab, 
  isHost, 
  isRecording, 
  onToggleRecord, 
  meetingId 
}: TeamsControlBarProps) {
  const participants = useParticipants();

  const handleTabToggle = (tab: 'chat' | 'participants') => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const handleEndMeeting = async () => {
    if (!meetingId) return;
    if (confirm("Are you sure you want to end this meeting for EVERYONE? This action cannot be undone.")) {
      try {
        await fetch("/api/calls/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "END_CALL",
            receiverId: "all",
            roomId: meetingId,
            forEveryone: true
          })
        });
        await fetch(`/api/meetings/${meetingId}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" })
        }).catch(() => {});
      } catch (err) {
        console.error(err);
        alert("Failed to end meeting");
      }
    }
  };

  return (
    <div className="absolute bottom-6 right-1/2 translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-slate-900/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl border border-slate-700/70 z-50 select-none">
      {/* Host Recording Button */}
      {isHost && (
        <>
          <button 
            onClick={onToggleRecord}
            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
              isRecording 
                ? "bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse" 
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
            }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <Square size={18} fill="currentColor" /> : <Circle size={18} />}
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
        </>
      )}

      {/* Primary Media Toggles */}
      <MicToggle />
      <CamToggle />
      <ScreenShareToggle />

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* People / Participants Button with Real-time Count Badge */}
      <button 
        onClick={() => handleTabToggle('participants')}
        className={`px-4 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 font-medium shadow-md ${
          activeTab === 'participants' 
            ? "bg-indigo-600 text-white border border-indigo-400 shadow-indigo-600/30" 
            : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
        }`}
        title="People / Participants"
      >
        <Users size={18} />
        <span className="text-xs font-semibold hidden sm:inline">People</span>
        <span 
          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'participants' 
              ? "bg-white/20 text-white" 
              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          }`}
        >
          {participants.length}
        </span>
      </button>

      {/* Chat Button */}
      <button 
        onClick={() => handleTabToggle('chat')}
        className={`p-3 sm:px-4 sm:py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 font-medium shadow-md ${
          activeTab === 'chat' 
            ? "bg-indigo-600 text-white border border-indigo-400 shadow-indigo-600/30" 
            : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
        }`}
        title="In-meeting Chat"
      >
        <MessageSquare size={18} />
        <span className="text-xs font-semibold hidden sm:inline">Chat</span>
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Leave Meeting Button */}
      <DisconnectButton style={{ backgroundColor: "transparent", border: "none", padding: 0 }}>
        <div 
          className="px-5 py-2.5 rounded-full transition-all duration-200 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white cursor-pointer gap-2 font-semibold shadow-lg shadow-red-600/20 border border-red-400"
          title="Leave meeting"
        >
          <PhoneOff size={18} />
          <span className="text-xs hidden sm:inline">Leave</span>
        </div>
      </DisconnectButton>

      {/* End Meeting Button (Host Only) */}
      {isHost && (
        <button 
          onClick={handleEndMeeting}
          className="p-3 rounded-full transition-all duration-200 flex items-center justify-center bg-red-950/70 hover:bg-red-900 text-red-400 hover:text-white cursor-pointer border border-red-500/30 ml-1"
          title="End Meeting for All"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
