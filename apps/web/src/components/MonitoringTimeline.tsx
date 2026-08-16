import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Monitor,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { TimelineSession } from '@tracker/shared';

interface MonitoringTimelineProps {
  childId: string;
  token: string;
  selectedDate: string;
}

export const MonitoringTimeline: React.FC<MonitoringTimelineProps> = ({
  childId,
  token,
  selectedDate,
}) => {
  const [sessions, setSessions] = useState<TimelineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/monitoring/timeline?childId=${childId}&date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchSessions();
    }
  }, [childId, selectedDate]);

  const categories = ['All', 'Education', 'Gaming', 'Entertainment', 'Social & Chat', 'Browsing', 'Utilities'];

  const filteredSessions = sessions.filter((s) => {
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      s.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.windowTitle && s.windowTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Session Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological audit log of active applications and window titles for {selectedDate}.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps or window titles..."
            className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              categoryFilter === cat
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading application timeline...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Clock size={36} className="mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-300">No session events recorded</h4>
          <p className="text-xs text-slate-500 mt-1">
            Activity stream is clean or no matching sessions for the selected filters.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredSessions.map((session) => {
            const startFormatted = new Date(session.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endFormatted = session.endTime
              ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now';

            const mins = Math.max(1, session.durationMinutes || Math.round(session.durationSeconds / 60));

            return (
              <div
                key={session.id}
                className="relative p-4 rounded-xl bg-[#0D1322] border border-slate-800/80 hover:border-slate-700 transition shadow-md group"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-slate-900 border-2 border-amber-400 group-hover:scale-125 transition-transform" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-100">{session.appName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                        {session.category}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        {session.deviceType === 'windows' ? (
                          <Monitor size={11} className="text-slate-400" />
                        ) : (
                          <Smartphone size={11} className="text-slate-400" />
                        )}
                        {session.deviceName}
                      </span>
                    </div>

                    {session.windowTitle && (
                      <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2">
                        {session.windowTitle}
                      </p>
                    )}
                  </div>

                  {/* Duration & Timestamp */}
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400 block">{mins} mins</span>
                    <span className="text-[10px] text-slate-500">
                      {startFormatted} – {endFormatted}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
