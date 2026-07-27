"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  PreJoin, 
  LocalUserChoices,
  useRoomContext,
  useConnectionState
} from "@livekit/components-react";
import { 
  VideoPresets, 
  RoomOptions, 
  RoomEvent, 
  Participant, 
  DisconnectReason, 
  ConnectionState 
} from "livekit-client";
import "@livekit/components-styles";
import { useRouter } from "next/navigation";
import { Loader2, Circle, Shield, Users, AlertTriangle, RefreshCw } from "lucide-react";
import TeamsControlBar from "./TeamsControlBar";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setActiveMeeting } from "@/lib/store/uiSlice";
import MeetingChat from "./MeetingChat";
import MeetingParticipants from "./MeetingParticipants";
import MeetingNotifications from "./MeetingNotifications";
import MeetingVideoGrid from "./MeetingVideoGrid";

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
};

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingId: string;
}

// Real-time Event Listener Component to guarantee instant UI updates on any RoomEvent
function RoomEventSync() {
  const room = useRoomContext();
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!room) return;

    // Attach listeners for all LiveKit room events required for Google Meet real-time UI
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

function ConnectionStatusBanner({ 
  roomError, 
  onRetry 
}: { 
  roomError: string | null; 
  onRetry: () => void;
}) {
  const connectionState = useConnectionState();

  if (roomError) {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-950/95 border border-red-500/60 px-4 py-2.5 rounded-xl shadow-2xl text-white animate-in fade-in duration-300">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-xs font-semibold">{roomError}</span>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold transition-colors ml-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting
  ) {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 border border-indigo-500/50 px-4 py-2 rounded-xl shadow-2xl text-white animate-in fade-in duration-300">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
        <span className="text-xs font-medium">
          {connectionState === ConnectionState.Reconnecting
            ? "Reconnecting to call..."
            : "Connecting to call..."}
        </span>
      </div>
    );
  }

  return null;
}

export default function MeetingRoom({ token, serverUrl, meetingId }: MeetingRoomProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeMeeting = useAppSelector(state => state.ui.activeMeeting);
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | null>(null);
  
  const [isHost, setIsHost] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/meetings/${meetingId}/recording`)
      .then(res => res.json())
      .then(data => {
        setIsHost(data.isHost || false);
        if (data.recording) {
          setIsRecording(true);
          setRecordingId(data.recording.egressId);
        }
      })
      .catch(console.error);
  }, [meetingId]);

  const handleToggleRecord = async () => {
    try {
      const action = isRecording ? "stop" : "start";
      const res = await fetch(`/api/meetings/${meetingId}/recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, egressId: recordingId })
      });
      const data = await res.json();
      if (res.ok) {
        setIsRecording(!isRecording);
        if (!isRecording) {
          setRecordingId(data.recording?.egressId);
        } else {
          setRecordingId(null);
        }
      } else {
        alert(`Failed to ${action} recording: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred with recording.");
    }
  };

  if (!token || !serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-white font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Connecting to secure LiveKit room...</p>
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 font-sans" data-lk-theme="default">
        <PreJoin
          onError={(err) => console.error("Error while setting up media devices:", err)}
          defaults={{
            audioEnabled: true,
            videoEnabled: activeMeeting?.isVideo !== false,
          }}
          onSubmit={(values) => setPreJoinChoices(values)}
        />
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={preJoinChoices.videoEnabled}
      audio={preJoinChoices.audioEnabled}
      options={roomOptions}
      token={token}
      serverUrl={serverUrl}
      connect={isCallActive}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onDisconnected={(reason?: DisconnectReason) => {
        console.log("[LiveKit] Room disconnected with reason:", reason);
        if (
          reason === DisconnectReason.CLIENT_INITIATED ||
          reason === DisconnectReason.ROOM_DELETED ||
          reason === DisconnectReason.DUPLICATE_IDENTITY
        ) {
          setIsCallActive(false);
          dispatch(setActiveMeeting(null));
          router.push("/");
        } else {
          console.warn("[LiveKit] Non-terminal disconnect reason:", reason, "- keeping call view active for reconnect.");
        }
      }}
      onError={(err) => {
        console.error("LiveKit Room Error:", err);
        setRoomError(err.message || "An unexpected connection error occurred.");
      }}
      className="font-sans"
    >
      {/* Real-time Connection Status & Error Banner */}
      <ConnectionStatusBanner roomError={roomError} onRetry={() => setRoomError(null)} />

      {/* Sync room events for real-time Google Meet sidebar & grid updates */}
      <RoomEventSync />

      {/* Top Header Information Badge */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-white tracking-wide">
            {activeMeeting?.title || `Meeting #${meetingId.slice(0, 8)}`}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 bg-red-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-red-500/40">
            <Circle size={12} className="text-red-500 animate-pulse fill-red-500" />
            <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Recording</span>
          </div>
        )}
      </div>

      <MeetingLayout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        meetingId={meetingId} 
        isHost={isHost} 
        isRecording={isRecording} 
        onToggleRecord={handleToggleRecord} 
      />

      {/* Mandatory RoomAudioRenderer so incoming audio plays automatically */}
      <RoomAudioRenderer />
      <MeetingNotifications />
    </LiveKitRoom>
  );
}

function MeetingLayout({ 
  activeTab, 
  setActiveTab, 
  meetingId, 
  isHost, 
  isRecording, 
  onToggleRecord 
}: { 
  activeTab: 'chat' | 'participants' | null; 
  setActiveTab: (tab: 'chat' | 'participants' | null) => void; 
  meetingId: string; 
  isHost: boolean; 
  isRecording: boolean; 
  onToggleRecord: () => void;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden relative">
      {/* Floating Bottom Control Bar */}
      <TeamsControlBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isHost={isHost} 
        isRecording={isRecording} 
        onToggleRecord={onToggleRecord} 
        meetingId={meetingId} 
      />
      
      {/* Main Google Meet Video Grid Stage Area */}
      <div className="flex-1 h-full pt-16 pb-24 px-2 sm:px-6 relative overflow-hidden flex items-center justify-center">
        <MeetingVideoGrid meetingId={meetingId} />
      </div>

      {/* Toggleable Right-hand Sidebar Panel (Google Meet style: "People / Participants" or "Chat") */}
      {activeTab && (
        <div className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl transition-all duration-300 animate-in slide-in-from-right">
          {activeTab === 'chat' && (
            <div className="flex-1 relative h-full">
              <MeetingChat meetingId={meetingId} />
            </div>
          )}
          {activeTab === 'participants' && (
            <div className="flex-1 relative h-full">
              <MeetingParticipants 
                isHost={isHost} 
                meetingId={meetingId} 
                onClose={() => setActiveTab(null)} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
