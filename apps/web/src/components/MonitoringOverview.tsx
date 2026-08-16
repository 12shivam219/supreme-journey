import React from 'react';
import {
  Monitor,
  Smartphone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MonitoringOverviewResponse } from '@tracker/shared';

interface MonitoringOverviewProps {
  overview: MonitoringOverviewResponse | null;
  onNavigateTab: (tab: 'timeline' | 'weekly' | 'alerts' | 'limits') => void;
}

export const MonitoringOverview: React.FC<MonitoringOverviewProps> = ({
  overview,
  onNavigateTab,
}) => {
  if (!overview) return null;

  const hours = Math.floor(overview.totalScreenTimeMinutes / 60);
  const minutes = overview.totalScreenTimeMinutes % 60;
  const limitHours = Math.floor(overview.dailyMinutesLimit / 60);
  const limitMinutes = overview.dailyMinutesLimit % 60;

  const usagePercent = Math.min(
    100,
    overview.dailyMinutesLimit > 0
      ? Math.round((overview.totalScreenTimeMinutes / overview.dailyMinutesLimit) * 100)
      : 0
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Screen Time Total */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Screen Time</span>
            <Clock size={18} className="text-amber-400" />
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white">
              {hours}h {minutes}m
            </span>
            <span className="text-xs text-slate-400">
              / {limitHours}h {limitMinutes > 0 ? `${limitMinutes}m` : ''} limit
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-2">
            <div
              style={{ width: `${usagePercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                overview.limitBreached
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : usagePercent >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{usagePercent}% of daily allowance</span>
            {overview.limitBreached && (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle size={11} /> Cap Reached
              </span>
            )}
          </p>
        </div>

        {/* Quick Device Telemetry Status */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Paired Devices</span>
            <Monitor size={18} className="text-cyan-400" />
          </div>

          {overview.devices.length === 0 ? (
            <div className="text-xs text-slate-500 py-3 italic">No devices registered for this profile.</div>
          ) : (
            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
              {overview.devices.map((dev) => (
                <div key={dev.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {dev.type === 'windows' ? (
                      <Monitor size={14} className="text-slate-400" />
                    ) : (
                      <Smartphone size={14} className="text-slate-400" />
                    )}
                    <span className="text-slate-200 font-medium">{dev.deviceName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dev.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span className={dev.isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {dev.isOnline ? 'Active' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Recent Alert */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Latest Safety Alert</span>
              <ShieldAlert size={18} className={overview.recentAlert && !overview.recentAlert.acknowledged ? 'text-amber-400' : 'text-slate-500'} />
            </div>

            {overview.recentAlert ? (
              <div>
                <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                  {overview.recentAlert.message}
                </p>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {new Date(overview.recentAlert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                <CheckCircle2 size={16} /> All clear. No safety warnings.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 pt-2 border-t border-slate-800/60 mt-2 transition"
          >
            Alerts Center <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Top 5 Apps Usage Breakdown */}
      <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-400" /> Top Applications Today
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time duration and category classification</p>
          </div>

          <button
            onClick={() => onNavigateTab('timeline')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
          >
            View Session Timeline <ArrowRight size={14} />
          </button>
        </div>

        {overview.topApps.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs">
            No application activity has been recorded for today yet.
          </div>
        ) : (
          <div className="space-y-4">
            {overview.topApps.map((app, idx) => {
              const appHours = Math.floor(app.minutes / 60);
              const appMins = app.minutes % 60;
              const formattedTime = appHours > 0 ? `${appHours}h ${appMins}m` : `${appMins}m`;

              return (
                <div key={app.appName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-slate-500 font-mono font-bold text-[11px]">0{idx + 1}</span>
                      <span className="font-semibold text-slate-200">{app.appName}</span>
                      {app.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700">
                          {app.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 font-medium">{formattedTime}</span>
                      <span className="text-slate-500 font-mono text-[11px] w-8 text-right">{app.percentage}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      style={{ width: `${app.percentage}%` }}
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-amber-400'
                          : idx === 1
                          ? 'bg-amber-500/80'
                          : idx === 2
                          ? 'bg-cyan-500/80'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
