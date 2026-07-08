import { Clock, Users, Video } from 'lucide-react';
import { CalendarMeeting } from '@/lib/types';

interface EventCardProps {
  meeting: CalendarMeeting;
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ meeting, compact, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition-all cursor-pointer ${
        meeting.isLive
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40'
      } ${compact ? 'p-1.5' : 'p-3'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`font-semibold text-[var(--text-primary)] leading-tight ${compact ? 'text-[9px]' : 'text-xs'}`}>
          {meeting.title}
        </p>
        {meeting.isLive && (
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        )}
      </div>
      {!compact && (
        <>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-secondary)]">
            <Clock className="w-3 h-3" />
            <span>{meeting.startTime} - {meeting.endTime}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--text-secondary)]">
            <Users className="w-3 h-3" />
            <span className="truncate">{meeting.attendees.join(', ')}</span>
          </div>
          {meeting.isLive && (
            <div className="flex items-center gap-1 mt-1.5 text-[9px] font-semibold text-emerald-400">
              <Video className="w-3 h-3" />
              <span>Live</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
