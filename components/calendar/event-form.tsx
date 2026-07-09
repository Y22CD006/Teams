import { useState, FormEvent } from 'react';
import { AlertCircle, Clock, Sparkles, Loader2 } from 'lucide-react';
import { CalendarMeeting } from '@/lib/types';

interface EventFormProps {
  selectedDate: string;
  existingMeetings: CalendarMeeting[];
  onSave: (meeting: Omit<CalendarMeeting, 'id'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

function suggestSlots(existing: CalendarMeeting[], date: string): string[] {
  const busy = new Set<string>();
  existing
    .filter((m) => m.date === date)
    .forEach((m) => {
      const [sh, sm] = m.startTime.split(':').map(Number);
      const [eh, em] = m.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      for (let m = startMin; m < endMin; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        busy.add(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    });

  const allSlots = generateTimeSlots();
  const workStart = 9 * 60; // 9:00
  const workEnd = 18 * 60;  // 18:00

  return allSlots.filter((slot) => {
    const [h, m] = slot.split(':').map(Number);
    const totalMin = h * 60 + m;
    if (totalMin < workStart || totalMin >= workEnd) return false;
    if (busy.has(slot)) return false;
    const nextSlot = `${(h + (m + 30 >= 60 ? 1 : 0)).toString().padStart(2, '0')}:${((m + 30) % 60).toString().padStart(2, '0')}`;
    return !busy.has(nextSlot);
  });
}

export function EventForm({ selectedDate, existingMeetings, onSave, onCancel, isSubmitting, serverError }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = suggestSlots(existingMeetings, selectedDate);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please provide a meeting title.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    const attendees = attendeesInput
      ? attendeesInput.split(',').map((name) => name.trim()).filter(Boolean)
      : [];

    onSave({
      title: title.trim(),
      organizer: '',
      date: selectedDate,
      startTime,
      endTime,
      description,
      attendees,
    });
  };

  const applySuggestion = (slot: string) => {
    const [h, m] = slot.split(':').map(Number);
    const endH = h + 1;
    setStartTime(slot);
    setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Meeting</h3>
        <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
          Scheduling for {new Date(selectedDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className="h-[1px] bg-[#374151]/50" />

      {(errorMsg || serverError) && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError || errorMsg}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Title</label>
        <input
          type="text"
          placeholder="Meeting title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {showSuggestions ? 'Hide' : 'Show'} available slots ({suggestions.length} free)
          </button>
          {showSuggestions && (
            <div className="flex flex-wrap gap-1 mt-1">
              {suggestions.slice(0, 12).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => applySuggestion(slot)}
                  className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                >
                  <Clock className="w-2.5 h-2.5 inline mr-1" />
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Attendees (comma separated)</label>
        <input
          type="text"
          placeholder="Sarah Chen, Marcus Vance"
          value={attendeesInput}
          onChange={(e) => setAttendeesInput(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Description</label>
        <textarea
          placeholder="Brief agenda..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-transparent hover:bg-[#1F2937] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#6366F1] hover:bg-[#5053e1] text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
