"use client";

import { Phone, Video, X } from "lucide-react";
import { useEffect, useState } from "react";

interface IncomingCallModalProps {
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
  isChannelCall?: boolean;
  channelName?: string;
}

export function IncomingCallModal({ callerName, isVideo, onAccept, onReject, isChannelCall, channelName }: IncomingCallModalProps) {
  const [ringTime, setRingTime] = useState(0);

  useEffect(() => {
    const audio = new Audio('/ringtone.mp3'); // Mock ringtone
    audio.loop = true;
    audio.play().catch(e => console.log('Audio autoplay blocked', e));
    
    const interval = setInterval(() => setRingTime(t => t + 1), 1000);
    return () => {
      audio.pause();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-[#201F1E] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      <div className="p-5 flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ring-4 ring-indigo-50 animate-pulse">
          {callerName.charAt(0)}
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{callerName}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
          {isChannelCall ? (
            <>Incoming channel {isVideo ? "video" : "audio"} call in <br/><span className="font-bold">#{channelName}</span>... {ringTime}s</>
          ) : (
            <>Incoming {isVideo ? "video" : "audio"} call... {ringTime}s</>
          )}
        </p>

        <div className="flex gap-4 w-full">
          <button
            onClick={onReject}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 flex justify-center items-center gap-2 font-semibold transition-colors"
          >
            <Phone className="w-4 h-4 rotate-[135deg]" />
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-[#5B5FC7] hover:bg-[#4F52B2] text-white rounded-lg py-2.5 flex justify-center items-center gap-2 font-semibold transition-colors"
          >
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
