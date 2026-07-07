"use client";

import { useState, FormEvent } from 'react';
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { CalendarMeeting } from '@/lib/types';

interface CalendarViewProps {
  meetings: CalendarMeeting[];
  onAddMeeting: (meeting: Omit<CalendarMeeting, 'id'>) => void;
  onJoinMeeting: (meeting: CalendarMeeting) => void;
  selectedMeetingId?: string | null;
}

export const CalendarView = ({ meetings, onAddMeeting, onJoinMeeting, selectedMeetingId }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 6));
  const [selectedDateStr, setSelectedDateStr] = useState('2026-07-06');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newDesc, setNewDesc] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-07-${dayNum.toString().padStart(2, '0')}`;
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    return {
      day: dayNum,
      dateStr,
      meetings: dayMeetings,
      isToday: dayNum === 6,
    };
  });

  const blankCells = Array.from({ length: 3 });

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setErrorMsg('');
  };

  const handleScheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Please provide a meeting title.');
      return;
    }

    const attendees = attendeesInput
      ? attendeesInput.split(',').map(name => name.trim()).filter(Boolean)
      : ['Alex Rivera'];

    onAddMeeting({
      title: newTitle,
      organizer: 'Alex Rivera',
      date: selectedDateStr,
      startTime: newStartTime,
      endTime: newEndTime,
      description: newDesc,
      attendees,
    });

    setNewTitle('');
    setNewDesc('');
    setAttendeesInput('');
    setShowScheduleForm(false);
    setErrorMsg('');
  };

  const activeMeetingsForSelectedDay = meetings.filter(m => m.date === selectedDateStr);

  return (
    <div id="calendar-workspace-view" className="flex-1 bg-[#0B0F19] flex flex-col md:flex-row h-full overflow-hidden">
      
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">July 2026</h2>
              <p className="text-xs text-gray-400 font-mono">Teams Scheduler Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-[#374151] bg-[#111827] text-gray-400 hover:text-white cursor-pointer hover:bg-[#1F2937]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#374151] bg-[#111827] text-gray-300">
              Today
            </button>
            <button className="p-1.5 rounded-lg border border-[#374151] bg-[#111827] text-gray-400 hover:text-white cursor-pointer hover:bg-[#1F2937]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center select-none pt-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        <div id="calendar-grid-cells" className="grid grid-cols-7 gap-1.5">
          {blankCells.map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square bg-transparent border border-transparent rounded-xl" />
          ))}

          {daysInMonth.map((cell) => {
            const isSelected = selectedDateStr === cell.dateStr;
            return (
              <div
                key={cell.day}
                id={`cal-day-cell-${cell.day}`}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`aspect-square bg-[#111827] border p-2 rounded-xl flex flex-col justify-between cursor-pointer group transition-all relative ${
                  isSelected 
                    ? 'border-[#6366F1] ring-1 ring-[#6366F1]/30 bg-[#1F2937]/50' 
                    : cell.isToday 
                      ? 'border-indigo-500/50' 
                      : 'border-[#374151] hover:border-gray-500 hover:bg-[#1F2937]/30'
                }`}
              >
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  cell.isToday 
                    ? 'text-white bg-[#6366F1] font-bold shadow-sm' 
                    : isSelected 
                      ? 'text-white bg-[#1F2937] border border-[#374151] font-bold' 
                      : 'text-gray-400 group-hover:text-white'
                }`}>
                  {cell.day}
                </span>

                <div className="space-y-0.5 max-h-[60%] overflow-hidden">
                  {cell.meetings.map((m) => (
                    <div 
                      key={m.id}
                      className={`text-[9px] px-1.5 py-0.5 rounded leading-tight truncate font-medium ${
                        m.isLive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      }`}
                    >
                      {m.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div id="calendar-agenda-drawer" className="w-full md:w-[320px] bg-[#111827] border-l border-[#374151] flex flex-col flex-shrink-0 h-full overflow-y-auto">
        
        {!showScheduleForm ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Agenda</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(selectedDateStr).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button
                id="btn-trigger-schedule-form"
                onClick={() => setShowScheduleForm(true)}
                className="bg-[#6366F1] text-white p-2 rounded-xl hover:bg-[#5053e1] transition-all"
                title="Schedule Meeting"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[1px] bg-[#374151]/50" />

            <div className="space-y-3">
              {activeMeetingsForSelectedDay.length === 0 ? (
                <div className="py-8 text-center select-none space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#1F2937] flex items-center justify-center text-gray-500 mx-auto">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No meetings scheduled</p>
                  <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">Click the "+" icon above to allocate a slot on this day.</p>
                </div>
              ) : (
                activeMeetingsForSelectedDay.map((meet) => (
                  <div
                    key={meet.id}
                    className={`p-3.5 rounded-xl border relative transition-all ${
                      selectedMeetingId === meet.id
                        ? 'bg-[#1F2937] border-[#6366F1]'
                        : meet.isLive
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-[#1F2937]/30 border-[#374151]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white leading-tight">{meet.title}</h4>
                      {meet.isLive && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{meet.startTime} - {meet.endTime}</span>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                      {meet.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#374151]/45">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-[9px] text-indigo-300 font-semibold truncate leading-none">
                        {meet.attendees.join(', ')}
                      </p>
                    </div>

                    {meet.isLive && (
                      <button
                        onClick={() => onJoinMeeting(meet)}
                        className="w-full mt-3 bg-[#6366F1] text-white py-2 rounded-xl hover:bg-[#5053e1] transition-all text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Join Active Call
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleScheduleSubmit} className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">New Meeting</h3>
              <p className="text-[10px] text-indigo-400 font-mono mt-0.5">Scheduling for {selectedDateStr}</p>
            </div>

            <div className="h-[1px] bg-[#374151]/50" />

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Meeting Title</label>
              <input
                id="input-meeting-title"
                type="text"
                placeholder="Apollo Guild Sprint Review..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#1F2937] text-white placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Start Time</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-[#1F2937] text-white text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">End Time</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full bg-[#1F2937] text-white text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Attendees (comma separated)</label>
              <input
                type="text"
                placeholder="Sarah Chen, Marcus Vance"
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                className="w-full bg-[#1F2937] text-white placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Description</label>
              <textarea
                placeholder="Brief agenda objectives..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full bg-[#1F2937] text-white placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1] resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="flex-1 bg-transparent hover:bg-[#1F2937] text-gray-400 hover:text-white py-2 rounded-xl border border-[#374151] text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-save-meeting-schedule"
                type="submit"
                className="flex-1 bg-[#6366F1] hover:bg-[#5053e1] text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-950/40"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};
