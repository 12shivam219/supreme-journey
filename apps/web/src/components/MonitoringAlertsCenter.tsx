import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Check,
  Clock,
  Loader2,
  Filter,
} from 'lucide-react';
import { Alert } from '@tracker/shared';

interface MonitoringAlertsCenterProps {
  childId?: string;
  token: string;
}

export const MonitoringAlertsCenter: React.FC<MonitoringAlertsCenterProps> = ({
  childId,
  token,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnack, setOnlyUnack] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = `${baseUrl}/monitoring/alerts?${childId ? `childId=${childId}&` : ''}unacknowledgedOnly=${onlyUnack}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [childId, onlyUnack]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const res = await fetch(`${baseUrl}/monitoring/alerts/${alertId}/ack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Alerts & Safety Center</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Notifications for screen time caps, new app installs, and unusual activities.
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setOnlyUnack(!onlyUnack)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            onlyUnack
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter size={13} />
          {onlyUnack ? 'Showing Unacknowledged Only' : 'Show All Alerts'}
        </button>
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Fetching alerts log...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <CheckCircle2 size={36} className="mx-auto text-emerald-500/80 mb-3" />
          <h4 className="text-sm font-bold text-slate-200">No active alerts</h4>
          <p className="text-xs text-slate-500 mt-1">All safety events are acknowledged and under normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isUnacknowledged = !alert.acknowledged;
            const timeStr = new Date(alert.triggeredAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isUnacknowledged
                    ? 'bg-[#0D1322] border-amber-500/40 shadow-lg'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnacknowledged
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    <ShieldAlert size={18} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${isUnacknowledged ? 'text-slate-100' : 'text-slate-400'}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock size={10} /> {timeStr}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {isUnacknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgingId === alert.id}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {acknowledgingId === alert.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                      <Check size={12} className="text-emerald-400" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
