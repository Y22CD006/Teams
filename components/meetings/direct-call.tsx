"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User as UserIcon } from "lucide-react";
import { User } from "@/lib/types";

interface DirectCallProps {
  currentUser: User;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string | null;
  isCaller: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
  onEndCall: () => void;
}

export const DirectCallView = ({
  currentUser,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  isCaller,
  incomingOffer,
  onEndCall,
}: DirectCallProps) => {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [status, setStatus] = useState<string>(isCaller ? "Calling..." : "Connecting...");
  const [meetingTime, setMeetingTime] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  // Helper to send signal to the target user
  const sendSignal = async (type: string, payload: any) => {
    await fetch("/api/calls/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, type, payload }),
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "Connected") {
      timer = setInterval(() => setMeetingTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let isUnmounted = false;
    const startCall = async () => {
      try {
        // 1. Get Local Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isUnmounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        peerConnection.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle remote tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setStatus("Connected");
          }
        };

        // Handle ICE Candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal("WEBRTC_ICE_CANDIDATE", { candidate: event.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            handleEndCall(false); // don't send end signal if already disconnected
          } else if (pc.connectionState === "connected") {
            setStatus("Connected");
          }
        };

        // 3. Caller vs Callee flow
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal("WEBRTC_OFFER", { offer });
        } else if (incomingOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("WEBRTC_ANSWER", { answer });
        }
      } catch (err) {
        console.error("Error starting WebRTC call:", err);
        setStatus("Failed to access camera/mic");
      }
    };

    startCall();

    // 4. Listen for signaling events via SSE globally dispatched to window
    const handleSignal = async (e: any) => {
      const data = e.detail;
      if (data.senderId !== targetUserId) return;

      const pc = peerConnection.current;
      if (!pc) return;

      try {
        if (data.type === "WEBRTC_ANSWER" && isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload.answer));
        } else if (data.type === "WEBRTC_ICE_CANDIDATE") {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload.candidate));
        } else if (data.type === "CALL_ENDED" || data.type === "CALL_DECLINED") {
          handleEndCall(false);
        }
      } catch (err) {
        console.error("Error handling WebRTC signal:", err);
      }
    };

    window.addEventListener("webrtc-signal", handleSignal);

    return () => {
      isUnmounted = true;
      window.removeEventListener("webrtc-signal", handleSignal);
      stopMedia();
      peerConnection.current?.close();
    };
  }, [isCaller, targetUserId, incomingOffer]);

  const stopMedia = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStream.current = null;
    }
  };

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((t) => (t.enabled = !micActive));
      setMicActive(!micActive);
    }
  };

  const toggleCamera = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((t) => (t.enabled = !cameraActive));
      setCameraActive(!cameraActive);
    }
  };

  const handleEndCall = (sendSignalEnd = true) => {
    stopMedia();
    if (sendSignalEnd) {
      sendSignal("CALL_ENDED", {});
    }
    onEndCall();
  };

  return (
    <div id="immersive-meeting-canvas" className="flex-1 bg-[#090D16] flex flex-col h-full overflow-hidden select-none relative z-50">
      
      {/* Header */}
      <div className="h-14 border-b border-[var(--border-color)] px-5 flex items-center justify-between bg-[var(--bg-secondary)]/90 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {status === "Connected" ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold font-mono tracking-wide">{formatTime(meetingTime)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-yellow-400 font-bold font-mono tracking-wide uppercase">{status}</span>
            </div>
          )}
          <div className="h-4 w-[1px] bg-[#374151]" />
          <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate">
            Call with {targetUserName}
          </h3>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 relative flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-5xl relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-color)]">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {status !== "Connected" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E293B]">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#0F172A] shadow-xl animate-pulse mb-4">
                {targetUserAvatar ? (
                  <span className="text-4xl">{targetUserAvatar}</span>
                ) : (
                  targetUserName.charAt(0)
                )}
              </div>
              <p className="text-white text-lg font-semibold">{targetUserName}</p>
              <p className="text-indigo-300 text-sm">{status}</p>
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-6 right-6 w-48 h-32 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700/50 z-20 transition-all hover:scale-105 group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!cameraActive && 'hidden'}`}
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]">
                <UserIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 flex gap-1">
              {!micActive && (
                <div className="bg-rose-500/80 p-1 rounded-md backdrop-blur-sm">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 border-t border-[var(--border-color)] px-6 bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              micActive
                ? "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[#2e3748]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
            }`}
            title={micActive ? "Mute Mic" : "Unmute Mic"}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              cameraActive
                ? "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[#2e3748]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
            }`}
            title={cameraActive ? "Stop Camera" : "Start Camera"}
          >
            {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleEndCall(true)}
            className="bg-rose-500 text-white px-6 py-3.5 rounded-2xl hover:bg-rose-600 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" /> <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>

    </div>
  );
};
