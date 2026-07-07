"use client";

import { useState, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, Hand, PhoneOff, MessageSquare, 
  Users, Maximize2, Grid, Layers, Volume2, ShieldAlert, Monitor, Sparkles
} from 'lucide-react';
import { User } from '@/lib/types';

interface MeetingViewProps {
  currentUser: User;
  meetingTitle: string;
  onLeave: () => void;
}

export const MeetingView = ({ currentUser, meetingTitle, onLeave }: MeetingViewProps) => {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'focus' | 'together'>('grid');
  const [meetingTime, setMeetingTime] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('Sarah Chen');

  useEffect(() => {
    const speakers = ['Sarah Chen', 'Marcus Vance', 'Alex Rivera', 'Emily Zhao'];
    const interval = setInterval(() => {
      const randomSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
      setActiveSpeaker(randomSpeaker);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const participants = [
    { name: 'Sarah Chen', initials: 'SC', role: 'Lead Architect', color: 'from-pink-500 to-rose-600', isSpeaking: activeSpeaker === 'Sarah Chen', cameraOn: true },
    { name: 'Marcus Vance', initials: 'MV', role: 'Staff Designer', color: 'from-amber-400 to-orange-500', isSpeaking: activeSpeaker === 'Marcus Vance', cameraOn: true },
    { name: 'Emily Zhao', initials: 'EZ', role: 'Director of Product', color: 'from-teal-400 to-emerald-600', isSpeaking: activeSpeaker === 'Emily Zhao', cameraOn: false },
    { name: 'Alex Rivera (You)', initials: 'AR', role: 'Principal UX Engineer', color: 'from-indigo-500 to-purple-600', isSpeaking: activeSpeaker === 'Alex Rivera', cameraOn: cameraActive, isMe: true },
  ];

  return (
    <div id="immersive-meeting-canvas" className="flex-1 bg-[#090D16] flex flex-col h-full overflow-hidden select-none relative">
      
      <div className="h-14 border-b border-[#374151]/40 px-5 flex items-center justify-between bg-[#111827]/90 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] text-rose-400 font-bold font-mono tracking-wide uppercase">REC {formatTime(meetingTime)}</span>
          </div>
          <div className="h-4 w-[1px] bg-[#374151]" />
          <div>
            <h3 className="text-xs font-semibold text-white leading-tight truncate max-w-[200px]">
              {meetingTitle}
            </h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Secure Multi-Region Bridge</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] text-indigo-300 font-semibold font-mono">Teams AI Noise Canceling Active</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setViewLayout('grid')}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              viewLayout === 'grid' 
                ? 'bg-[#1F2937] border-[#6366F1] text-[#6366F1]' 
                : 'bg-[#111827] border-[#374151] text-gray-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <Grid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button 
            onClick={() => setViewLayout('focus')}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              viewLayout === 'focus' 
                ? 'bg-[#1F2937] border-[#6366F1] text-[#6366F1]' 
                : 'bg-[#111827] border-[#374151] text-gray-400 hover:text-white'
            }`}
            title="Presenter Focus View"
          >
            <Layers className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Focus</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 relative flex items-center justify-center overflow-hidden">
        
        {screenShareActive ? (
          <div className="w-full h-full flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#111827] border border-indigo-500 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
              <div className="h-8 bg-[#1F2937] border-b border-[#374151] px-4 flex items-center justify-between text-[11px] font-mono text-indigo-400">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> {currentUser.name} is sharing their screen
                </span>
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 rounded">LIVE PREVIEW</span>
              </div>
              
              <div className="flex-1 bg-[#0B0F19] p-6 flex flex-col justify-between font-sans text-white">
                <div className="space-y-4 max-w-lg">
                  <div className="text-sm font-bold text-indigo-300">Apollo Component Library Refactor Branch</div>
                  <div className="bg-[#111827] p-4 rounded-xl border border-[#374151] font-mono text-[10px] text-gray-300 space-y-1 overflow-x-auto shadow-inner">
                    <p className="text-gray-500">// Debounce ResizeObserver calculation to prevent frame pacing bottle-necks</p>
                    <p><span className="text-pink-400">const</span> useDebouncedResize = (callback, delay) =&gt; {'{'}</p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">const</span> timeoutRef = useRef();</p>
                    <p>&nbsp;&nbsp;useEffect(() =&gt; () =&gt; clearTimeout(timeoutRef.current), []);</p>
                    <p>&nbsp;&nbsp;<span className="text-pink-400">return</span> useCallback((...args) =&gt; {'{'}</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;clearTimeout(timeoutRef.current);</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;timeoutRef.current = setTimeout(() =&gt; callback(...args), delay);</p>
                    <p>&nbsp;&nbsp;{'}'}, [callback, delay]);</p>
                    <p>{'}'};</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This custom react hook decouples expensive canvas recalculations from browser layout passes. Testing showed Firefox repaints dropped from 14ms down to under 2ms!
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-4 border-t border-[#374151]/40">
                  <span>vscode-workspace // apollo-design-system</span>
                  <span>96% efficiency gain verified</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-56 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[140px] md:max-h-none flex-shrink-0">
              {participants.map((user, idx) => (
                <div 
                  key={idx}
                  className={`w-40 md:w-full h-24 rounded-xl bg-[#111827] border flex flex-col items-center justify-center relative flex-shrink-0 transition-all ${
                    user.isSpeaking 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-900/10' 
                      : 'border-[#374151]'
                  }`}
                >
                  {user.cameraOn ? (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-white text-xs font-bold border border-[#374151] mb-1.5 shadow`}>
                      {user.initials}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold mb-1.5">
                      {user.initials}
                    </div>
                  )}
                  <span className="text-[10px] text-white font-medium truncate max-w-[85%]">{user.name}</span>
                  {user.isSpeaking && (
                    <div className="absolute top-2 right-2 flex gap-0.5 items-end h-2">
                      <span className="w-0.5 bg-emerald-500 h-1.5 animate-pulse" />
                      <span className="w-0.5 bg-emerald-500 h-2.5 animate-pulse delay-75" />
                      <span className="w-0.5 bg-emerald-500 h-2 animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`w-full h-full max-w-5xl grid gap-4 ${
            viewLayout === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : 'grid-cols-1'
          }`}>
            {participants
              .filter(u => viewLayout === 'grid' || (viewLayout === 'focus' && u.isSpeaking))
              .map((user, idx) => {
                const isSpeakingActive = user.isSpeaking && !screenShareActive;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border bg-[#111827] relative overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
                      isSpeakingActive 
                        ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.01] shadow-emerald-950/20' 
                        : 'border-[#374151] hover:border-gray-500'
                    }`}
                  >
                    {user.cameraOn ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex flex-col items-center justify-center p-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-2xl font-bold border-2 border-[#1F2937] shadow-xl animate-pulse`}>
                          {user.initials}
                        </div>
                        <div className="mt-3.5 text-center">
                          <p className="text-xs text-indigo-300 font-bold tracking-wide uppercase font-mono">{user.role}</p>
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">Webcam Node // H.264 HD Stream</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-[#0B0F19] flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-lg font-bold">
                          {user.initials}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono mt-2">Webcam Feed Paused</span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5 z-10">
                      {user.isMe ? (
                        micActive ? <Mic className="w-3.5 h-3.5 text-indigo-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        user.name === 'Emily Zhao' ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                      )}
                    </div>

                    {isSpeakingActive && (
                      <div className="absolute left-4 top-4 bg-emerald-500 text-black px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow font-mono animate-pulse">
                        <Volume2 className="w-3 h-3" /> Speaking
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white font-semibold flex items-center gap-2 z-10">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {user.name}
                    </div>
                  </div>
                );
            })}
          </div>
        )}

        {raisedHand && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl animate-bounce z-40 text-xs border border-yellow-400">
            <Hand className="w-4 h-4 fill-black" />
            <span>Alex Rivera Raised Hand</span>
          </div>
        )}
      </div>

      <div className="h-20 border-t border-[#374151]/40 px-6 bg-[#111827] flex items-center justify-between flex-shrink-0 z-10">
        
        <div className="hidden sm:flex items-center gap-2.5">
          <button className="bg-[#1F2937] text-gray-400 hover:text-white p-2 rounded-xl border border-[#374151] hover:bg-[#2e3748] transition-all">
            <Users className="w-4.5 h-4.5" />
          </button>
          <button className="bg-[#1F2937] text-gray-400 hover:text-white p-2 rounded-xl border border-[#374151] hover:bg-[#2e3748] transition-all">
            <MessageSquare className="w-4.5 h-4.5" />
          </button>
        </div>

        <div id="meeting-primary-controls-rail" className="flex items-center gap-2 sm:gap-3.5 mx-auto">
          <button
            id="btn-toggle-mic"
            onClick={() => setMicActive(!micActive)}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              micActive
                ? 'bg-[#1F2937] border-[#374151] text-white hover:bg-[#2e3748]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title={micActive ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            id="btn-toggle-camera"
            onClick={() => setCameraActive(!cameraActive)}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              cameraActive
                ? 'bg-[#1F2937] border-[#374151] text-white hover:bg-[#2e3748]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title={cameraActive ? 'Stop Camera' : 'Start Camera'}
          >
            {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            id="btn-toggle-screenshare"
            onClick={() => setScreenShareActive(!screenShareActive)}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              screenShareActive
                ? 'bg-indigo-500 text-white border-indigo-400 hover:bg-[#5053e1]'
                : 'bg-[#1F2937] border-[#374151] text-indigo-400 hover:text-indigo-300 hover:bg-[#2e3748]'
            }`}
            title={screenShareActive ? 'Stop Sharing' : 'Share Screen'}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          <button
            onClick={() => setRaisedHand(!raisedHand)}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              raisedHand
                ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-600'
                : 'bg-[#1F2937] border-[#374151] text-gray-400 hover:text-white hover:bg-[#2e3748]'
            }`}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-8 bg-[#374151] mx-1" />

          <button
            id="btn-hangup-call"
            onClick={onLeave}
            className="bg-rose-500 text-white px-5 py-3 rounded-2xl hover:bg-rose-600 transition-all font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4.5 h-4.5" /> <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Volume2 className="w-4.5 h-4.5 text-gray-400" />
          <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="w-4/5 h-full bg-[#6366F1]" />
          </div>
        </div>

      </div>

    </div>
  );
};
