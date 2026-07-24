"use client";

import { useRoomContext } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Settings } from "lucide-react";
import { RoomEvent } from "livekit-client";
import { useEffect, useState } from "react";

interface CallControlsProps {
  onEndCall: () => void;
}

export function MockCallControls({ onEndCall }: CallControlsProps) {
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  return (
    <CallControlsUI 
      isMicEnabled={isMicEnabled}
      isCameraEnabled={isCameraEnabled}
      isScreenShareEnabled={isScreenShareEnabled}
      toggleMic={() => setIsMicEnabled(!isMicEnabled)}
      toggleCamera={() => setIsCameraEnabled(!isCameraEnabled)}
      toggleScreenShare={() => setIsScreenShareEnabled(!isScreenShareEnabled)}
      onEndCall={onEndCall}
    />
  );
}

export function CallControls({ onEndCall }: CallControlsProps) {
  const room = useRoomContext();
  const [isMicEnabled, setIsMicEnabled] = useState(room.localParticipant.isMicrophoneEnabled);
  const [isCameraEnabled, setIsCameraEnabled] = useState(room.localParticipant.isCameraEnabled);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(room.localParticipant.isScreenShareEnabled);

  useEffect(() => {
    const onTrackUpdated = () => {
      setIsMicEnabled(room.localParticipant.isMicrophoneEnabled);
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
      setIsScreenShareEnabled(room.localParticipant.isScreenShareEnabled);
    };

    room.on(RoomEvent.LocalTrackPublished, onTrackUpdated);
    room.on(RoomEvent.LocalTrackUnpublished, onTrackUpdated);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, onTrackUpdated);
      room.off(RoomEvent.LocalTrackUnpublished, onTrackUpdated);
    };
  }, [room]);

  const toggleMic = async () => {
    await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    await room.localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    await room.localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  return (
    <CallControlsUI 
      isMicEnabled={isMicEnabled}
      isCameraEnabled={isCameraEnabled}
      isScreenShareEnabled={isScreenShareEnabled}
      toggleMic={toggleMic}
      toggleCamera={toggleCamera}
      toggleScreenShare={toggleScreenShare}
      onEndCall={onEndCall}
    />
  );
}

interface CallControlsUIProps {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  onEndCall: () => void;
}

function CallControlsUI({
  isMicEnabled,
  isCameraEnabled,
  isScreenShareEnabled,
  toggleMic,
  toggleCamera,
  toggleScreenShare,
  onEndCall
}: CallControlsUIProps) {
  return (
    <div className="flex items-center gap-3 bg-[#1F1F1F] px-4 py-2 rounded-xl shadow-lg border border-white/10 mx-auto">
      <button 
        onClick={toggleCamera}
        className={`p-3 rounded-full transition-colors flex items-center justify-center
          ${isCameraEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
        title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      <button 
        onClick={toggleMic}
        className={`p-3 rounded-full transition-colors flex items-center justify-center
          ${isMicEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
        title={isMicEnabled ? "Mute" : "Unmute"}
      >
        {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      <button 
        onClick={toggleScreenShare}
        className={`p-3 rounded-full transition-colors flex items-center justify-center
          ${isScreenShareEnabled ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        title="Share screen"
      >
        <MonitorUp className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-white/20 mx-2" />

      <button 
        className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <button 
        onClick={onEndCall}
        className="p-3 px-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 font-semibold transition-colors ml-2"
      >
        <PhoneOff className="w-5 h-5" />
        Leave
      </button>
    </div>
  );
}
