"use client";

import { useParticipants } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, User as UserIcon, UserMinus, MicOff as ForceMicOff, MonitorOff } from "lucide-react";
import { Participant, Track } from "livekit-client";

interface MeetingParticipantsProps {
  isHost?: boolean;
  meetingId?: string;
}

export default function MeetingParticipants({ isHost, meetingId }: MeetingParticipantsProps) {
  const participants = useParticipants();

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
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Participants ({participants.length})
        </h2>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map((participant: Participant) => {
          let profileImage = null;
          try {
            const meta = participant.metadata ? JSON.parse(participant.metadata) : null;
            profileImage = meta?.profileImage;
          } catch (e) {}

          const isMicEnabled = participant.isMicrophoneEnabled;
          const isCamEnabled = participant.isCameraEnabled;
          const isScreenSharing = participant.isScreenShareEnabled;

          return (
            <div 
              key={participant.identity} 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 relative">
                  {profileImage ? (
                    <img src={profileImage} alt={participant.name || "User"} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                      <UserIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  {/* Status Indicator (Optional) */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {participant.name || "Unknown User"}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {participant.isLocal ? "You" : "Participant"}
                  </span>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isScreenSharing && (
                  <div className="flex items-center group">
                    <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-md" title="Sharing Screen">
                      <MonitorUp size={16} />
                    </div>
                    {isHost && !participant.isLocal && (
                      <button 
                        onClick={() => {
                          const pub = participant.getTrackPublication(Track.Source.ScreenShare);
                          if (pub?.trackSid) handleModerate('mute', participant.identity, pub.trackSid);
                        }}
                        className="hidden group-hover:flex ml-1 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                        title="Stop Screen Share"
                      >
                        <MonitorOff size={16} />
                      </button>
                    )}
                  </div>
                )}
                
                <div className={`p-1.5 rounded-md ${isCamEnabled ? "text-slate-300" : "text-red-400 bg-red-400/10"}`} title={isCamEnabled ? "Camera On" : "Camera Off"}>
                  {isCamEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                </div>

                <div className="flex items-center group">
                  <div className={`p-1.5 rounded-md ${isMicEnabled ? "text-slate-300" : "text-red-400 bg-red-400/10"}`} title={isMicEnabled ? "Microphone On" : "Microphone Off"}>
                    {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                  </div>
                  {isHost && !participant.isLocal && isMicEnabled && (
                    <button 
                      onClick={() => {
                        const pub = participant.getTrackPublication(Track.Source.Microphone);
                        if (pub?.trackSid) handleModerate('mute', participant.identity, pub.trackSid);
                      }}
                      className="hidden group-hover:flex ml-1 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                      title="Force Mute"
                    >
                      <ForceMicOff size={16} />
                    </button>
                  )}
                </div>

                {isHost && !participant.isLocal && (
                   <button 
                     onClick={() => {
                       if(confirm(`Are you sure you want to remove ${participant.name || 'this participant'} from the meeting?`)) {
                          handleModerate('remove', participant.identity);
                       }
                     }}
                     className="ml-2 p-1.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-md transition-colors"
                     title="Remove Participant"
                   >
                     <UserMinus size={16} />
                   </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
