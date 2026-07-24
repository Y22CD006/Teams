"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";

interface CallWindowProps {
  roomId: string;
  isCaller: boolean;
  isVideo: boolean;
  onEndCall: () => void;
  otherUserName: string;
  otherUserId: string;
}

export function CallWindow({
  roomId,
  isCaller,
  isVideo,
  onEndCall,
  otherUserName,
  otherUserId,
}: CallWindowProps) {
  const currentUser = useAppSelector((s) => s.auth.user);
  
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(isVideo);
  const [status, setStatus] = useState<string>("Connecting...");
  const [callTime, setCallTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const pendingOffer = useRef<any>(null);
  const iceQueue = useRef<RTCIceCandidateInit[]>([]);
  const isSettingDescription = useRef<boolean>(false);

  // Helper to send signal to the target user via API
  const sendSignal = async (type: string, payload: any) => {
    try {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          receiverId: otherUserId,
          roomId,
          isVideo,
          callerName: currentUser?.name,
          payload,
        }),
      });
    } catch (err) {
      console.error("Failed to send WebRTC signal:", err);
    }
  };

  // Timer for duration of the active call
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "Connected") {
      timer = setInterval(() => setCallTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let isUnmounted = false;

    const startCall = async () => {
      try {
        setPermissionError(null);
        // 1. Request microphone and optional camera stream
        const constraints = {
          audio: true,
          video: isVideo ? { width: 1280, height: 720 } : false,
        };
        
        console.log("Requesting local media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (isUnmounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStream.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Instantiate RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        });
        peerConnection.current = pc;

        // 3. Add local media tracks to the connection
        console.log("Adding local tracks to PeerConnection");
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 4. Handle remote tracks
        pc.ontrack = (event) => {
          console.log("Received remote track:", event.track.kind);
          
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            
            // Bind audio track to audio element
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.volume = 1.0;
              remoteAudioRef.current.play().catch((err) => {
                console.error("Autoplay remote audio blocked/failed:", err);
              });
            }

            // Bind video stream if video call
            if (isVideo && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }

            setStatus("Connected");
          }
        };

        // 5. Send local ICE candidates to peer
        pc.onicecandidate = (event) => {
          if (event.candidate && !isUnmounted) {
            console.log("Sending local ICE candidate to peer");
            sendSignal("WEBRTC_ICE_CANDIDATE", { candidate: event.candidate });
          }
        };

        // 6. Monitor PeerConnection connection states
        pc.onconnectionstatechange = () => {
          if (isUnmounted) return;
          console.log("RTCPeerConnection connectionState changed:", pc.connectionState);
          
          if (pc.connectionState === "connected") {
            setStatus("Connected");
          } else if (pc.connectionState === "failed") {
            console.warn("Peer connection failed. Clean up.");
            handleEndCall(false);
          } else if (pc.connectionState === "closed") {
            handleEndCall(false);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (isUnmounted) return;
          console.log("RTCPeerConnection iceConnectionState changed:", pc.iceConnectionState);
          if (pc.iceConnectionState === "failed") {
            console.warn("ICE Connection failed.");
            // We do not immediately disconnect here to allow retries, 
            // the main connectionState 'failed' will capture final drops.
          } else if (pc.iceConnectionState === "closed") {
            handleEndCall(false);
          }
        };

        // 7. Initiate Caller vs Callee negotiation flow
        if (isCaller) {
          console.log("Caller initiating WebRTC offer");
          setStatus("Calling...");
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: isVideo,
          });
          
          isSettingDescription.current = true;
          await pc.setLocalDescription(offer);
          isSettingDescription.current = false;
          
          await sendSignal("WEBRTC_OFFER", { offer });
        } else {
          setStatus("Connecting...");
          // If we had a pending offer while media was loading, process it now
          if (pendingOffer.current) {
            console.log("Processing queued remote offer now that local media is ready");
            await handleOffer(pendingOffer.current);
          }
        }
      } catch (err: any) {
        console.error("Error accessing microphone/camera or starting WebRTC:", err);
        setPermissionError(
          err.message || "Microphone permission was denied or could not be accessed."
        );
        setStatus("Permission Error");
      }
    };

    // Helper function to handle WebRTC SDP Offer
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      const pc = peerConnection.current;
      if (!pc) return;

      try {
        console.log("Setting remote description (SDP Offer)");
        isSettingDescription.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        isSettingDescription.current = false;

        console.log("Creating SDP Answer");
        const answer = await pc.createAnswer();
        
        isSettingDescription.current = true;
        await pc.setLocalDescription(answer);
        isSettingDescription.current = false;

        console.log("Sending local SDP Answer");
        await sendSignal("WEBRTC_ANSWER", { answer });

        // Process any ICE candidates received prior to setting remote description
        await processQueuedCandidates();
      } catch (err) {
        console.error("Error setting offer or generating answer:", err);
        isSettingDescription.current = false;
      }
    };

    // Helper to process queued ICE candidates
    const processQueuedCandidates = async () => {
      const pc = peerConnection.current;
      if (!pc || !pc.remoteDescription) return;

      console.log(`Processing ${iceQueue.current.length} queued ICE candidates`);
      while (iceQueue.current.length > 0) {
        const candidateInit = iceQueue.current.shift();
        if (candidateInit) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          } catch (err) {
            console.error("Failed to add queued ICE candidate:", err);
          }
        }
      }
    };

    // 8. Listen to signaling messages dispatched from dashboard.tsx
    const handleSignalEvent = async (e: any) => {
      const data = e.detail;
      // Filter out messages that aren't for this call/room
      if (data.roomId !== roomId || data.callerId !== otherUserId) return;

      const pc = peerConnection.current;
      
      try {
        if (data.type === "WEBRTC_ANSWER" && isCaller && pc) {
          console.log("Received remote SDP Answer from callee");
          isSettingDescription.current = true;
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload.answer));
          isSettingDescription.current = false;
          
          await processQueuedCandidates();
          setStatus("Connected");
        } else if (data.type === "WEBRTC_OFFER" && !isCaller) {
          console.log("Received remote SDP Offer from caller");
          if (pc) {
            await handleOffer(data.payload.offer);
          } else {
            // Media isn't ready yet, queue the offer
            console.log("Media not ready. Queuing remote offer.");
            pendingOffer.current = data.payload.offer;
          }
        } else if (data.type === "WEBRTC_ICE_CANDIDATE") {
          console.log("Received remote ICE candidate");
          const candInit = data.payload.candidate;
          
          if (pc && pc.remoteDescription && !isSettingDescription.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candInit));
          } else {
            // Queue candidates if remote description is not set yet
            console.log("Remote description not set yet. Queuing ICE candidate.");
            iceQueue.current.push(candInit);
          }
        } else if (data.type === "END_CALL" || data.type === "REJECT_CALL") {
          console.log("Call ended by remote peer");
          handleEndCall(false);
        }
      } catch (err) {
        console.error("Error handling signaling event:", err);
        isSettingDescription.current = false;
      }
    };

    // Run media startup and signaling listeners
    startCall();
    window.addEventListener("webrtc-signal", handleSignalEvent);

    return () => {
      isUnmounted = true;
      window.removeEventListener("webrtc-signal", handleSignalEvent);
      
      // Stop all tracks to release device hardware
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
      
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      
      console.log("CallWindow cleanup complete");
    };
  }, [isCaller, otherUserId, roomId, isVideo]);

  const handleEndCall = (sendEndSignal = true) => {
    // Release media
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    // Send signal if requested
    if (sendEndSignal) {
      sendSignal("END_CALL", {});
    }
    // Call UI callback
    onEndCall();
  };

  const toggleMic = () => {
    if (localStream.current) {
      const active = !micActive;
      localStream.current.getAudioTracks().forEach((t) => (t.enabled = active));
      setMicActive(active);
    }
  };

  const toggleCamera = () => {
    if (localStream.current && isVideo) {
      const active = !cameraActive;
      localStream.current.getVideoTracks().forEach((t) => (t.enabled = active));
      setCameraActive(active);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0F0F10] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center justify-between p-6">
      
      {/* Remote Audio Player (Always unmuted, active, autoPlay) */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Header Info */}
      <div className="w-full flex items-center justify-between text-white z-10">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-400">Call with</span>
          <span className="text-lg font-bold">{otherUserName}</span>
        </div>
        
        {status === "Connected" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 font-semibold tracking-wide">
            {formatTime(callTime)}
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            {status !== "Permission Error" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status}
          </div>
        )}
      </div>

      {/* Center Display: Video Stream grid or Audio-only profile */}
      <div className="flex-1 w-full flex items-center justify-center py-6 relative">
        {permissionError ? (
          <div className="max-w-md text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 font-semibold mb-2">Microphone Error</p>
            <p className="text-gray-400 text-sm">{permissionError}</p>
          </div>
        ) : isVideo ? (
          <div className="w-full h-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Remote Video Container */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden relative flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {status !== "Connected" && (
                <div className="absolute inset-0 bg-[#0F0F10] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                    {otherUserName.charAt(0)}
                  </div>
                  <p className="text-gray-400 text-sm">Waiting for {otherUserName}...</p>
                </div>
              )}
            </div>

            {/* Local Video Container */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden relative flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 bg-[#0F0F10] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <p className="text-gray-400 text-sm">Camera Off</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audio-only UI with vibrant pulser */
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              {status === "Connected" && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-indigo-500/20 animate-ping opacity-60" />
                  <div className="absolute w-48 h-48 rounded-full border border-indigo-500/10 animate-ping opacity-45 delay-300" />
                </>
              )}
              {/* Core Avatar */}
              <div className="w-32 h-32 bg-indigo-600/90 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl relative z-10 border-2 border-indigo-400/40">
                {otherUserName.charAt(0)}
              </div>
            </div>
            <p className="text-gray-400 mt-6 text-sm font-medium tracking-wide">
              {status === "Connected" ? "Voice call connected" : status}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center gap-4 bg-white/5 px-6 py-3.5 rounded-2xl border border-white/10 z-10">
        {/* Toggle Mic Button */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            micActive
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          title={micActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Toggle Video Button (Only if video call is supported/requested) */}
        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              cameraActive
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={cameraActive ? "Stop Camera" : "Start Camera"}
          >
            {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        )}

        {/* Separator */}
        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Leave/Hang up Call Button */}
        <button
          onClick={() => handleEndCall(true)}
          className="p-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 font-semibold transition-all cursor-pointer shadow-lg shadow-red-950/40"
          title="Hang Up"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave</span>
        </button>
      </div>

    </div>
  );
}
