import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CheckSquare,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ActivityDigestDTO } from '@tracker/shared';

interface DigestPreviewViewProps {
  childId: string;
  token: string;
}

export const DigestPreviewView: React.FC<DigestPreviewViewProps> = ({
  childId,
  token,
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [digest, setDigest] = useState<ActivityDigestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchDigest = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/monitoring/digest/preview?childId=${childId}&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDigest(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchDigest();
    }
  }, [childId, period]);

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setSendSuccess(false);
    try {
      const res = await fetch(`${baseUrl}/monitoring/digest/test-send?childId=${childId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="text-amber-400" size={20} /> Email Digest Intelligence
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated daily &amp; weekly activity emails sent to parent inbox at 8:00 PM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Daily / Weekly Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === 'daily'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === 'weekly'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly
            </button>
          </div>

          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-lg flex items-center gap-2 ${
              sendSuccess
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50'
            }`}
          >
            {sendSuccess ? (
              <>
                <CheckCircle2 size={15} /> Digest Sent!
              </>
            ) : sendingTest ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={15} /> Send Test Email
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Generating digest preview...</span>
        </div>
      ) : !digest ? (
        <div className="p-12 text-center text-slate-500 text-xs">No digest data available.</div>
      ) : (
        /* Email Preview Mockup Container */
        <div className="p-6 md:p-8 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Email Subject Preview
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">
                {digest.period === 'daily' ? 'Daily' : 'Weekly'} Activity Digest for {digest.childName}
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {digest.dateRange.start} – {digest.dateRange.end}
            </span>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Clock size={12} className="text-amber-400" /> Screen Time
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {digest.totalScreenTimeHours}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <CheckSquare size={12} className="text-emerald-400" /> Tasks &amp; Habits
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {digest.tasksCompletedCount + digest.habitsCompletedCount} completed
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldAlert size={12} className="text-rose-400" /> Safety Alerts
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {digest.alertsTriggeredCount} triggered
              </span>
            </div>
          </div>

          {/* Top Apps List */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" /> Top Application Activity
            </h5>

            {digest.topApps.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No application activity recorded in this period.</p>
            ) : (
              <div className="space-y-2">
                {digest.topApps.map((app) => (
                  <div key={app.appName} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{app.appName}</span>
                    <span className="text-slate-500 font-mono">
                      {Math.floor(app.minutes / 60)}h {app.minutes % 60}m ({app.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
