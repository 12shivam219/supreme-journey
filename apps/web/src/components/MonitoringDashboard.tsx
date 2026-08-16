import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  Clock,
  BarChart3,
  ShieldAlert,
  Sliders,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MonitoringOverview } from './MonitoringOverview.tsx';
import { MonitoringTimeline } from './MonitoringTimeline.tsx';
import { MonitoringWeeklyReport } from './MonitoringWeeklyReport.tsx';
import { MonitoringAlertsCenter } from './MonitoringAlertsCenter.tsx';
import { MonitoringLimits } from './MonitoringLimits.tsx';
import { DigestPreviewView } from './DigestPreviewView.tsx';
import { MonitoringOverviewResponse } from '@tracker/shared';
import { io } from 'socket.io-client';

interface MonitoringDashboardProps {
  token: string;
  childrenList: any[];
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  token,
  childrenList,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timeline' | 'weekly' | 'alerts' | 'limits' | 'digest'>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [overviewData, setOverviewData] = useState<MonitoringOverviewResponse | null>(null);
  const [liveToast, setLiveToast] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Automatically select first child if not set
  useEffect(() => {
    if (childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList]);

  const fetchOverview = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${baseUrl}/monitoring/overview?childId=${selectedChildId}&date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to load monitoring overview');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchOverview();
    }
  }, [selectedChildId, selectedDate]);

  // Live WebSocket Listener for Real-Time Alerts
  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('alert:new', (alertData: any) => {
      setLiveToast({ type: alertData.type, message: alertData.message });
      fetchOverview();
      setTimeout(() => setLiveToast(null), 6000);
    });

    socket.on('device:status', () => {
      fetchOverview();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (childrenList.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0D1322] border border-slate-800 shadow-xl max-w-lg mx-auto space-y-4">
        <Monitor size={40} className="mx-auto text-amber-400" />
        <h3 className="text-lg font-bold text-white">No Children Profiles Registered</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Create a child profile and pair their Windows or Android device to enable telemetry and safety monitoring.
        </p>
      </div>
    );
  }

  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar Controls: Child Selector & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl">
        {/* Child Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
            {selectedChild?.name?.charAt(0) || 'C'}
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Active Family Member
            </label>
            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.id} className="bg-slate-900 text-white">
                    {child.name} ({child.age ? `${child.age} yrs` : 'Child'})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Live Alert Toast Banner */}
      {liveToast && (
        <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/50 shadow-2xl flex items-center justify-between text-amber-300 text-xs animate-bounce">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="text-amber-400" />
            <div>
              <span className="font-bold block">Live Safety Alert</span>
              <span>{liveToast.message}</span>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-amber-400 hover:text-white text-xs font-bold px-2 py-1 rounded-md"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'timeline', label: 'Session Timeline', icon: Clock },
          { id: 'weekly', label: 'Weekly Intelligence', icon: BarChart3 },
          { id: 'alerts', label: 'Alerts Center', icon: ShieldAlert },
          { id: 'limits', label: 'Screen Time Limits', icon: Sliders },
          { id: 'digest', label: 'Email Digest', icon: LayoutDashboard },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeSubTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSubTab(id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'overview' && (
          loading && !overviewData ? (
            <div className="flex items-center justify-center h-48 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="ml-2 text-xs">Loading activity summary...</span>
            </div>
          ) : (
            <MonitoringOverview
              overview={overviewData}
              onNavigateTab={(tab) => setActiveSubTab(tab)}
            />
          )
        )}

        {activeSubTab === 'timeline' && (
          <MonitoringTimeline
            childId={selectedChildId}
            token={token}
            selectedDate={selectedDate}
          />
        )}

        {activeSubTab === 'weekly' && (
          <MonitoringWeeklyReport
            childId={selectedChildId}
            token={token}
            selectedDate={selectedDate}
          />
        )}

        {activeSubTab === 'alerts' && (
          <MonitoringAlertsCenter
            childId={selectedChildId}
            token={token}
          />
        )}

        {activeSubTab === 'limits' && (
          <MonitoringLimits
            childId={selectedChildId}
            token={token}
          />
        )}

        {activeSubTab === 'digest' && (
          <DigestPreviewView
            childId={selectedChildId}
            token={token}
          />
        )}
      </div>
    </div>
  );
};
