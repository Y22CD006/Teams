"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight,
  ListTodo, CalendarDays, LayoutGrid,
} from 'lucide-react';
import { CalendarMeeting, CalendarTask, CalendarViewType } from '@/lib/types';
import { EventForm } from './event-form';
import { TaskForm } from '@/components/tasks/task-form';

interface CalendarViewProps {
  meetings: CalendarMeeting[];
  tasks: CalendarTask[];
  onAddMeeting: (meeting: Omit<CalendarMeeting, 'id'>) => void;
  onAddTask: (task: { title: string; description: string; priority: string; dueDate: string; dueTime?: string }) => void;
  onJoinMeeting: (meeting: CalendarMeeting) => void;
  selectedMeetingId?: string | null;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getHourSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

function meetingsForDate(meetings: CalendarMeeting[], dateStr: string): CalendarMeeting[] {
  return meetings.filter((m) => m.date === dateStr);
}

function tasksForDate(tasks: CalendarTask[], dateStr: string): CalendarTask[] {
  return tasks.filter((t) => t.date === dateStr);
}



export const CalendarView = ({
  meetings, tasks, onAddMeeting, onAddTask, onJoinMeeting, selectedMeetingId,
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const t = new Date();
    return formatDateStr(t.getFullYear(), t.getMonth(), t.getDate());
  });
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formMode, setFormMode] = useState<'meeting' | 'task'>('meeting');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = useMemo(() =>
    currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' }),
  [currentDate]);

  const selectedDate = new Date(selectedDateStr + 'T12:00:00');

  const navigatePrevious = () => {
    const d = new Date(currentDate);
    if (viewType === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewType === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (viewType === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewType === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDateStr(formatDateStr(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target as Node)) {
        setShowScheduleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setShowScheduleForm(false);
  };

  const handleScheduleClick = (mode: 'meeting' | 'task') => {
    setFormMode(mode);
    setShowScheduleForm(true);
    setShowScheduleDropdown(false);
  };

  const handleFormSave = async (data: Omit<CalendarMeeting, 'id'>) => {
    setIsSubmitting(true);
    try {
      await onAddMeeting(data);
      setShowScheduleForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskSave = async (data: { title: string; description: string; priority: string; dueDate: string; dueTime?: string }) => {
    setIsSubmitting(true);
    try {
      await onAddTask(data);
      setShowScheduleForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Month view
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthDays = useMemo(() =>
    Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = formatDateStr(year, month, dayNum);
      return {
        day: dayNum,
        dateStr,
        isToday: isToday(year, month, dayNum),
      };
    }),
  [year, month, daysInMonth]);

  const activeMeetingsForSelectedDay = meetingsForDate(meetings, selectedDateStr);
  const activeTasksForSelectedDay = tasksForDate(tasks, selectedDateStr);

  // Week view
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const hourSlots = getHourSlots();

  // Day view
  const dayHours = hourSlots;

  const formatDayLabel = (d: Date) =>
    d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const renderMonthView = () => (
    <div className="space-y-2 sm:space-y-4">
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center select-none pt-1 sm:pt-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-[8px] sm:text-[10px] font-bold text-gray-500 font-mono uppercase tracking-wider py-0.5 sm:py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`blank-${i}`} className="aspect-square bg-transparent border border-transparent rounded-xl" />
        ))}

        {monthDays.map((cell) => {
          const isSel = selectedDateStr === cell.dateStr;
          return (
            <div
              key={cell.day}
              onClick={() => handleDayClick(cell.dateStr)}
              className={`aspect-square bg-[var(--bg-secondary)] border p-1.5 rounded-xl flex flex-col cursor-pointer group transition-all relative ${
                isSel
                  ? 'border-[#6366F1] ring-1 ring-[#6366F1]/30 bg-[var(--bg-tertiary)]/50'
                  : cell.isToday
                    ? 'border-indigo-500/50'
                    : 'border-[var(--border-color)] hover:border-gray-500 hover:bg-[#1F2937]/30'
              }`}
            >
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md self-start ${
                cell.isToday
                  ? 'text-white bg-[#6366F1] font-bold shadow-sm'
                  : isSel
                    ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] font-bold'
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
              }`}>
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const weekDateStrs = weekDays.map((d) =>
      formatDateStr(d.getFullYear(), d.getMonth(), d.getDate())
    );

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-[var(--border-color)] border-b border-[var(--border-color)]">
          <div className="bg-[var(--bg-secondary)] p-2 text-[9px] font-bold text-gray-500 uppercase font-mono" />
          {weekDays.map((d, i) => {
            const ds = weekDateStrs[i];
            const isSel = selectedDateStr === ds;
            const isT = isToday(d.getFullYear(), d.getMonth(), d.getDate());
            return (
              <div
                key={i}
                onClick={() => handleDayClick(ds)}
                className={`bg-[var(--bg-secondary)] p-2 text-center cursor-pointer transition-colors ${
                  isSel ? 'bg-indigo-500/10' : ''
                }`}
              >
                <div className="text-[10px] text-gray-500 font-mono">
                  {d.toLocaleDateString([], { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                  isT ? 'bg-[#6366F1] text-white' : 'text-[var(--text-primary)]'
                }`}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-[var(--border-color)]">
            {hourSlots.map((hour) => (
              <div key={hour} className="contents">
                <div className="bg-[var(--bg-secondary)] p-1.5 text-[9px] text-gray-500 font-mono text-right pr-2 border-b border-[var(--border-color)]">
                  {hour}
                </div>
                {weekDays.map((_, dayIdx) => {
                  const ds = weekDateStrs[dayIdx];
                  return (
                    <div
                      key={`${hour}-${dayIdx}`}
                      onClick={() => handleDayClick(ds)}
                      className="bg-[var(--bg-primary)] p-1 min-h-[40px] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-tertiary)]/20 transition-colors"
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[var(--border-color)]">
          {dayHours.map((hour) => (
            <div key={hour} className="flex min-h-[48px] group hover:bg-[var(--bg-tertiary)]/20 transition-colors">
              <div className="w-16 flex-shrink-0 p-2 text-[9px] text-gray-500 font-mono text-right border-r border-[var(--border-color)]">
                {hour}
              </div>
              <div className="flex-1 p-1" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaDrawer = () => (
    <div className="w-full md:w-[320px] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col flex-shrink-0 h-full overflow-y-auto">
      {!showScheduleForm ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Agenda</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div ref={scheduleRef} className="relative">
                <button
                  onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                  className="bg-[#6366F1] text-white px-3 py-2 rounded-xl hover:bg-[#5053e1] transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Schedule"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule
                </button>
                {showScheduleDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => handleScheduleClick('meeting')}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => handleScheduleClick('task')}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                    >
                      <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                      Add Task
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {}}
                className="p-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                title="Meeting Admin"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[#374151]/50" />

          <div className="space-y-3">
            {activeTasksForSelectedDay.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ListTodo className="w-3 h-3" /> Tasks
                </p>
                {activeTasksForSelectedDay.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)]">{t.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        t.priority === 'HIGH' ? 'text-rose-400 bg-rose-500/10' :
                        t.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10' :
                        'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    {t.time && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-secondary)] font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Due by {t.time}</span>
                      </div>
                    )}
                    {t.assigneeName && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Assignee: {t.assigneeName}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeMeetingsForSelectedDay.length === 0 && activeTasksForSelectedDay.length === 0 ? (
              <div className="py-8 text-center select-none space-y-2">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-gray-500 mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Nothing scheduled</p>
                <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">
                  Click Schedule to add a meeting or task.
                </p>
              </div>
            ) : (
              activeMeetingsForSelectedDay.map((meet) => (
                <div
                  key={meet.id}
                  className={`p-3.5 rounded-xl border relative transition-all ${
                    selectedMeetingId === meet.id
                      ? 'bg-[var(--bg-tertiary)] border-[#6366F1]'
                      : meet.isLive
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[var(--bg-tertiary)]/30 border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{meet.title}</h4>
                    {meet.isLive && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[var(--text-secondary)] font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{meet.startTime} - {meet.endTime}</span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed">{meet.description}</p>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border-color)]">
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
      ) : formMode === 'meeting' ? (
        <div className="p-4">
          <EventForm
            selectedDate={selectedDateStr}
            existingMeetings={meetings}
            onSave={handleFormSave}
            onCancel={() => setShowScheduleForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
        <div className="p-4">
          <TaskForm
            selectedDate={selectedDateStr}
            onSave={handleTaskSave}
            onCancel={() => setShowScheduleForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 bg-[var(--bg-primary)] flex flex-col md:flex-row h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 sm:p-5 pb-0 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                  {viewType === 'day'
                    ? formatDayLabel(selectedDate)
                    : monthLabel}
                </h2>
                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-mono">Teams Scheduler Sync</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-0.5 sm:gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-0.5">
                <button
                  onClick={() => setViewType('month')}
                  className={`p-1 sm:p-1.5 rounded-md transition-colors ${viewType === 'month' ? 'bg-[#6366F1] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'} cursor-pointer`}
                  title="Month view"
                >
                  <LayoutGrid className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
                <button
                  onClick={() => setViewType('week')}
                  className={`p-1 sm:p-1.5 rounded-md transition-colors ${viewType === 'week' ? 'bg-[#6366F1] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'} cursor-pointer`}
                  title="Week view"
                >
                  <CalendarDays className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
                <button
                  onClick={() => setViewType('day')}
                  className={`p-1 sm:p-1.5 rounded-md transition-colors ${viewType === 'day' ? 'bg-[#6366F1] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'} cursor-pointer`}
                  title="Day view"
                >
                  <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrevious}
                  className="p-1 sm:p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:bg-[#1F2937]"
                >
                  <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={navigateNext}
                  className="p-1 sm:p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:bg-[#1F2937]"
                >
                  <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-5 pt-2 sm:pt-3 overflow-hidden">
          {viewType === 'month' && (
            <div className="h-full overflow-y-auto">
              {renderMonthView()}
            </div>
          )}
          {viewType === 'week' && (
            <div className="h-full">
              {renderWeekView()}
            </div>
          )}
          {viewType === 'day' && (
            <div className="h-full">
              {renderDayView()}
            </div>
          )}
        </div>
      </div>

      {renderAgendaDrawer()}
    </div>
  );
};
