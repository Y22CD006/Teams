"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Participant } from "livekit-client";
import { useEffect, useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";

export default function MeetingNotifications() {
  const room = useRoomContext();
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'join' | 'leave' }[]>([]);

  useEffect(() => {
    if (!room) return;

    const playSound = (type: 'join' | 'leave') => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'join') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
          oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
        } else {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime); // C#5
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1); // A4
        }
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // Ignore audio errors (e.g. autoplay policies)
      }
    };

    const handleParticipantConnected = (participant: Participant) => {
      const name = participant.name || participant.identity || 'A participant';
      const id = Math.random().toString();
      setNotifications(prev => [...prev, { id, message: `${name} joined the meeting`, type: 'join' }]);
      playSound('join');
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      const name = participant.name || participant.identity || 'A participant';
      const id = Math.random().toString();
      setNotifications(prev => [...prev, { id, message: `${name} left the meeting`, type: 'leave' }]);
      playSound('leave');
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  if (notifications.length === 0) return null;

  return (
    <div className="absolute bottom-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 backdrop-blur-md"
        >
           {n.type === 'join' ? (
             <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
               <UserPlus size={16} />
             </div>
           ) : (
             <div className="w-8 h-8 rounded-full bg-slate-700/50 text-slate-400 flex items-center justify-center shrink-0">
               <UserMinus size={16} />
             </div>
           )}
           <span className="text-sm font-medium">{n.message}</span>
        </div>
      ))}
    </div>
  );
}
