"use client";

import { Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

interface OutgoingCallModalProps {
  receiverName: string;
  isVideo: boolean;
  onCancel: () => void;
}

export function OutgoingCallModal({ receiverName, isVideo, onCancel }: OutgoingCallModalProps) {
  const [ringTime, setRingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setRingTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#201F1E] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 relative">
          {receiverName.charAt(0)}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-75"></div>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{receiverName}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Calling... {ringTime}s
        </p>

        <button
          onClick={onCancel}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
