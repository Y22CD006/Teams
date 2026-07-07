import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Calendar</h1>
      <CalendarView />
    </div>
  );
}
