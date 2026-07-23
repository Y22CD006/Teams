"use client";
import { useState, useEffect } from "react";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  PreJoin, 
  LocalUserChoices,
  GridLayout,
  ParticipantTile,
  useTracks
} from "@livekit/components-react";
import { Track, VideoPresets, RoomOptions } from "livekit-client";
import "@livekit/components-styles";
import { useRouter } from "next/navigation";
import { Loader2, Circle } from "lucide-react";
import TeamsControlBar from "./TeamsControlBar";
import MeetingChat from "./MeetingChat";
import MeetingParticipants from "./MeetingParticipants";
import MeetingNotifications from "./MeetingNotifications";

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingId: string;
}

export default function MeetingRoom({ token, serverUrl, meetingId }: MeetingRoomProps) {
  const router = useRouter();
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | null>(null);
  
  const [isHost, setIsHost] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p>Connecting to secure room...</p>
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950" data-lk-theme="default">
        <PreJoin
          onError={(err) => console.error("Error while setting up media devices:", err)}
          defaults={{
            audioEnabled: true,
            videoEnabled: true,
          }}
          onSubmit={(values) => setPreJoinChoices(values)}
        />
      </div>
    );
  }

  const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
  };

  return (
    <LiveKitRoom
      video={preJoinChoices.videoEnabled}
      audio={preJoinChoices.audioEnabled}
      options={roomOptions}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onDisconnected={() => {
        router.push("/");
      }}
      onError={(err) => {
        console.error("LiveKit Room Error:", err);
        // You could dispatch a toast here if we had a global toast system
      }}
    >
      {isRecording && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-red-500/30">
          <Circle size={12} className="text-red-500 animate-pulse fill-red-500" />
          <span className="text-xs font-semibold text-slate-200">Recording</span>
        </div>
      )}
      <MeetingLayout activeTab={activeTab} setActiveTab={setActiveTab} meetingId={meetingId} isHost={isHost} isRecording={isRecording} onToggleRecord={handleToggleRecord} />
      <RoomAudioRenderer />
      <MeetingNotifications />
    </LiveKitRoom>
  );
}

function MeetingLayout({ activeTab, setActiveTab, meetingId, isHost, isRecording, onToggleRecord }: { activeTab: 'chat' | 'participants' | null, setActiveTab: (tab: 'chat' | 'participants' | null) => void, meetingId: string, isHost: boolean, isRecording: boolean, onToggleRecord: () => void }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      <TeamsControlBar activeTab={activeTab} setActiveTab={setActiveTab} isHost={isHost} isRecording={isRecording} onToggleRecord={onToggleRecord} meetingId={meetingId} />
      
      {/* Main Video Area */}
      <div className="flex-1 p-4 pt-24 pb-4 h-full relative">
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
      </div>

      {/* Sidebar Area */}
      {activeTab && (
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full pt-20">
          {activeTab === 'chat' && (
             <div className="flex-1 relative h-full">
               <MeetingChat meetingId={meetingId} />
             </div>
          )}
          {activeTab === 'participants' && (
             <div className="flex-1 relative h-full">
               <MeetingParticipants isHost={isHost} meetingId={meetingId} />
             </div>
          )}
        </div>
      )}
    </div>
  );
}
