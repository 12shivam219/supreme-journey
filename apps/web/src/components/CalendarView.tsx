import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  X,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { CalendarEvent } from '@tracker/shared';

interface CalendarViewProps {
  token: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ token }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await fetch(`${baseUrl}/calendar/events?start=${firstDay}&end=${lastDay}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

      const res = await fetch(`${baseUrl}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          location: location.trim() || undefined,
          color,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create event');
      }

      setTitle('');
      setDescription('');
      setLocation('');
      setModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${baseUrl}/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEvents();
      if (selectedDayEvents) {
        setSelectedDayEvents({
          ...selectedDayEvents,
          events: selectedDayEvents.events.filter((ev) => ev.id !== eventId),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Month Grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const todayStr = new Date().toISOString().split('T')[0];

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map events to YYYY-MM-DD
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const dStr = new Date(ev.startTime).toISOString().split('T')[0];
    if (!eventsByDate[dStr]) eventsByDate[dStr] = [];
    eventsByDate[dStr].push(ev);
  }

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarIcon size={14} />
            <span>Unified Life Calendar</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            {monthName} {year}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus size={16} /> Schedule Event
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Month Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading schedule...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty_${idx}`} className="h-28 rounded-xl bg-slate-950/20 border border-slate-900/40" />;
            }

            const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dayDateStr === todayStr;
            const dayEvents = eventsByDate[dayDateStr] || [];

            return (
              <div
                key={dayDateStr}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents({ date: dayDateStr, events: dayEvents });
                  } else {
                    setDate(dayDateStr);
                    setModalOpen(true);
                  }
                }}
                className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition cursor-pointer group ${
                  isToday
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500">{dayEvents.length}</span>
                  )}
                </div>

                {/* Event Markers */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1"
                      style={{
                        backgroundColor: `${ev.color || '#3b82f6'}20`,
                        color: ev.color || '#3b82f6',
                        borderLeft: `2px solid ${ev.color || '#3b82f6'}`,
                      }}
                    >
                      <span>{ev.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-slate-500 font-bold block pl-1">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day Events Popout Drawer */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setSelectedDayEvents(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <CalendarIcon size={16} className="text-amber-400" />
                Schedule for {selectedDayEvents.date}
              </h3>
              <p className="text-xs text-slate-400 mb-4">Scheduled events and task deadlines</p>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color || '#3b82f6' }}
                        />
                        <h4 className="text-xs font-bold text-slate-200">{ev.title}</h4>
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ev.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {ev.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {!ev.isTaskDeadline && (
                      <button
                        onClick={(e) => handleDeleteEvent(ev.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setDate(selectedDayEvents.date);
                  setSelectedDayEvents(null);
                  setModalOpen(true);
                }}
                className="w-full mt-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
              >
                + Add Event on this Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Schedule Calendar Event</h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Team Sync, Family Dinner, Gym Session"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Scheduling...' : 'Save Event'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
