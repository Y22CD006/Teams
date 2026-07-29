"use client";

import { useState, useMemo } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
} from 'lucide-react';
import { CalendarMeeting, CalendarTask, CalendarViewType } from '@/lib/types';

interface CalendarViewProps {
  meetings: CalendarMeeting[];
  tasks: CalendarTask[];
  selectedDateStr: string;
  onDateSelect: (dateStr: string) => void;
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

function meetingsForDateAndHour(meetings: CalendarMeeting[], dateStr: string, hour: number): CalendarMeeting[] {
  return meetings.filter((m) => {
    if (m.date !== dateStr) return false;
    const mHour = parseInt(m.startTime.split(':')[0], 10);
    return mHour === hour;
  });
}

export const CalendarView = ({
  meetings, tasks, selectedDateStr, onDateSelect,
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = useMemo(() =>
    currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' }),
  [currentDate]);

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
    onDateSelect(formatDateStr(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  const handleDayClick = (dateStr: string) => {
    onDateSelect(dateStr);
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
        meetings: meetingsForDate(meetings, dateStr),
        tasks: tasksForDate(tasks, dateStr),
      };
    }),
  [year, month, daysInMonth, meetings, tasks]);

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
          const dayMeetings = meetingsForDate(meetings, cell.dateStr);
          const dayTasks = tasksForDate(tasks, cell.dateStr);
          const allItems = [
            ...dayMeetings.map(m => ({ ...m, type: 'meeting' as const })),
            ...dayTasks.map(t => ({ ...t, type: 'task' as const })),
          ];
          
          return (
            <div
              key={cell.day}
              onClick={() => handleDayClick(cell.dateStr)}
              className={`aspect-square bg-[var(--bg-secondary)] border p-1 rounded-xl flex flex-col cursor-pointer group transition-all relative ${
                isSel
                  ? 'border-[#6366F1] ring-1 ring-[#6366F1]/30 bg-[var(--bg-tertiary)]/50'
                  : cell.isToday
                    ? 'border-indigo-500/50'
                    : 'border-[var(--border-color)] hover:border-gray-500 hover:bg-[#1F2937]/30'
              }`}
            >
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md mb-0.5 self-start ${
                cell.isToday
                  ? 'text-white bg-[#6366F1] font-bold shadow-sm'
                  : isSel
                    ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] font-bold'
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
              }`}>
                {cell.day}
              </span>
              
              <div className="flex-1 overflow-y-auto mt-1 space-y-1 scrollbar-none">
                {allItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`text-[9px] px-1.5 py-0.5 rounded border truncate font-semibold leading-none ${
                      item.type === 'meeting'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        : item.priority === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : item.priority === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                    title={`${item.type === 'meeting' ? 'Meeting' : 'Task'}: ${item.title}`}
                  >
                    {item.title}
                  </div>
                ))}
                {allItems.length > 3 && (
                  <div className="text-[8px] text-gray-500 font-bold pl-1">
                    +{allItems.length - 3} more
                  </div>
                )}
              </div>
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

        {/* All-day tasks & meetings */}
        {weekDays.some((_, i) => {
          const ds = weekDateStrs[i];
          return tasksForDate(tasks, ds).length > 0 || meetingsForDate(meetings, ds).some(m => parseInt(m.startTime.split(':')[0], 10) === 0);
        }) && (
          <div className="grid grid-cols-8 gap-px bg-[var(--border-color)] border-b border-[var(--border-color)]">
            <div className="bg-[var(--bg-secondary)] p-1.5 text-[8px] text-gray-500 font-mono text-right pr-2 flex items-center justify-end">
              all-day
            </div>
            {weekDays.map((_, dayIdx) => {
              const ds = weekDateStrs[dayIdx];
              const dayTasks = tasksForDate(tasks, ds);
              const dayMeetings = meetingsForDate(meetings, ds).filter(m => parseInt(m.startTime.split(':')[0], 10) === 0);
              const items = [...dayTasks.map(t => ({ ...t, type: 'task' as const })), ...dayMeetings.map(m => ({ ...m, type: 'meeting' as const }))];
              return (
                <div
                  key={`allday-${dayIdx}`}
                  onClick={() => handleDayClick(ds)}
                  className="bg-[var(--bg-primary)] p-1 cursor-pointer hover:bg-[var(--bg-tertiary)]/20 transition-colors min-h-[28px]"
                >
                  {items.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={`text-[7px] px-1 py-0.5 rounded mb-0.5 truncate font-medium ${
                        item.type === 'task'
                          ? 'bg-amber-500/15 text-amber-400 border-l-2 border-amber-500'
                          : item.isLive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-300'
                      }`}
                    >
                      {item.title}
                    </div>
                  ))}
                  {items.length > 2 && <div className="text-[6px] text-gray-500 px-1">+{items.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-[var(--border-color)]">
            {hourSlots.map((hour) => (
              <div key={hour} className="contents">
                <div className="bg-[var(--bg-secondary)] p-1.5 text-[9px] text-gray-500 font-mono text-right pr-2 border-b border-[var(--border-color)]">
                  {hour}
                </div>
                {weekDays.map((_, dayIdx) => {
                  const ds = weekDateStrs[dayIdx];
                  const hourMeetings = meetingsForDate(meetings, ds).filter((m) => {
                    const startHour = m.startTime.split(":")[0];
                    const slotHour = hour.split(":")[0];
                    return startHour === slotHour;
                  });
                  const hourTasks = tasksForDate(tasks, ds).filter((t) => {
                    if (!t.time) return false;
                    const dueHour = t.time.split(":")[0];
                    const slotHour = hour.split(":")[0];
                    return dueHour === slotHour;
                  });
                  
                  const allHourItems = [
                    ...hourMeetings.map(m => ({ ...m, type: 'meeting' as const })),
                    ...hourTasks.map(t => ({ ...t, type: 'task' as const })),
                  ];

                  return (
                    <div
                      key={`${hour}-${dayIdx}`}
                      onClick={() => handleDayClick(ds)}
                      className="bg-[var(--bg-primary)] p-1 min-h-[40px] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-tertiary)]/20 transition-colors relative flex flex-col gap-0.5"
                    >
                      {allHourItems.map((item) => (
                        <div
                          key={item.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded border truncate font-semibold leading-none ${
                            item.type === 'meeting'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              : item.priority === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : item.priority === 'MEDIUM'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                          title={`${item.type === 'meeting' ? 'Meeting' : 'Task'}: ${item.title}`}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
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
    const dayMeetings = meetingsForDate(meetings, selectedDateStr);
    const dayTasks = tasksForDate(tasks, selectedDateStr);
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[var(--border-color)]">
          {dayHours.map((hour) => {
            const hourMeetings = meetingsForDate(meetings, selectedDateStr).filter((m) => {
              const startHour = m.startTime.split(":")[0];
              const slotHour = hour.split(":")[0];
              return startHour === slotHour;
            });
            const hourTasks = tasksForDate(tasks, selectedDateStr).filter((t) => {
              if (!t.time) return false;
              const dueHour = t.time.split(":")[0];
              const slotHour = hour.split(":")[0];
              return dueHour === slotHour;
            });

            return (
              <div key={hour} className="flex min-h-[48px] group hover:bg-[var(--bg-tertiary)]/20 transition-colors">
                <div className="w-16 flex-shrink-0 p-2 text-[9px] text-gray-500 font-mono text-right border-r border-[var(--border-color)]">
                  {hour}
                </div>
                <div className="flex-1 p-2 flex flex-col gap-1">
                  {hourMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 max-w-lg font-semibold flex items-center justify-between"
                    >
                      <span>Meeting: {m.title}</span>
                      <span className="text-[10px] text-indigo-400 font-mono font-medium">{m.startTime} - {m.endTime}</span>
                    </div>
                  ))}
                  {hourTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`text-xs px-3 py-1.5 rounded-xl max-w-lg font-semibold flex items-center justify-between border ${
                        t.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <span>Task: {t.title}</span>
                      <span className="text-[10px] opacity-80 font-mono font-medium">Due at {t.time || "12:00"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedDate = new Date(selectedDateStr + 'T12:00:00');

  return (
    <div className="flex-1 bg-[var(--bg-primary)] flex flex-col h-full overflow-hidden">
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
  );
};
