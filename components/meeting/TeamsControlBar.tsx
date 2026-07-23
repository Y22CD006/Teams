"use client";

import { useTrackToggle, DisconnectButton, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, Settings, PhoneOff, Circle, Square, Trash2 } from "lucide-react";

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
    <button onClick={() => toggle()} className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${enabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
      {enabled ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
};

const CamToggle = () => {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Camera });
  return (
    <button onClick={() => toggle()} className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${enabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
      {enabled ? <Video size={20} /> : <VideoOff size={20} />}
    </button>
  );
};

const ScreenShareToggle = () => {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });
  return (
    <button onClick={() => toggle()} className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${enabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
      <MonitorUp size={20} />
    </button>
  );
};

export default function TeamsControlBar({ activeTab, setActiveTab, isHost, isRecording, onToggleRecord, meetingId }: TeamsControlBarProps) {
  const handleTabToggle = (tab: 'chat' | 'participants') => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const handleEndMeeting = async () => {
    if (!meetingId) return;
    if (confirm("Are you sure you want to end this meeting for EVERYONE? This action cannot be undone.")) {
      try {
        await fetch(`/api/meetings/${meetingId}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" })
        });
      } catch (err) {
        console.error(err);
        alert("Failed to end meeting");
      }
    }
  };

  return (
    <div className="absolute top-4 right-1/2 translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-slate-800 z-50">
      {isHost && (
        <>
          <button 
            onClick={onToggleRecord}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${isRecording ? 'bg-red-600/20 text-red-500 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Circle size={20} />}
          </button>
          <div className="w-px h-8 bg-slate-700 mx-2" />
        </>
      )}

      <MicToggle />
      <CamToggle />
      <ScreenShareToggle />

      <div className="w-px h-8 bg-slate-700 mx-2" />

      {/* Chat Button */}
      <button 
        onClick={() => handleTabToggle('chat')}
        className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
        title="Chat"
      >
        <MessageSquare size={20} />
      </button>

      {/* Participants Button */}
      <button 
        onClick={() => handleTabToggle('participants')}
        className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${activeTab === 'participants' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
        title="Participants"
      >
        <Users size={20} />
      </button>

      {/* Settings Button */}
      <button 
        className="p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      <div className="w-px h-8 bg-slate-700 mx-2" />

      {/* Leave Meeting Button */}
      <DisconnectButton style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
        <div className="p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white cursor-pointer px-6 gap-2 font-medium">
          <PhoneOff size={20} />
          <span>Leave</span>
        </div>
      </DisconnectButton>

      {/* End Meeting Button (Host Only) */}
      {isHost && (
        <button 
          onClick={handleEndMeeting}
          className="p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-red-900/40 hover:bg-red-900 text-red-500 hover:text-white cursor-pointer ml-2"
          title="End Meeting for All"
        >
          <Trash2 size={20} />
        </button>
      )}
    </div>
  );
}
