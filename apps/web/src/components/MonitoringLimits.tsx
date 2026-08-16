import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  Save,
  Check,
  Loader2,
  Gamepad2,
  Tv,
  MessageCircle,
  Calendar,
} from 'lucide-react';

interface MonitoringLimitsProps {
  childId: string;
  token: string;
}

export const MonitoringLimits: React.FC<MonitoringLimitsProps> = ({
  childId,
  token,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [dailyMinutes, setDailyMinutes] = useState<number>(240);
  const [gamingLimit, setGamingLimit] = useState<number>(90);
  const [entertainmentLimit, setEntertainmentLimit] = useState<number>(60);
  const [socialLimit, setSocialLimit] = useState<number>(45);

  // Day of week limits
  const [weekdayLimit, setWeekdayLimit] = useState<number>(180);
  const [weekendLimit, setWeekendLimit] = useState<number>(240);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/monitoring/limits/${childId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDailyMinutes(data.dailyMinutesLimit || 240);

        if (data.categoryLimitsJson) {
          const cats = data.categoryLimitsJson as Record<string, number>;
          if (cats.Gaming !== undefined) setGamingLimit(cats.Gaming);
          if (cats.Entertainment !== undefined) setEntertainmentLimit(cats.Entertainment);
          if (cats['Social & Chat'] !== undefined) setSocialLimit(cats['Social & Chat']);
        }

        if (data.dayOfWeekLimitsJson) {
          const days = data.dayOfWeekLimitsJson as Record<string, number>;
          if (days['1'] !== undefined) setWeekdayLimit(days['1']);
          if (days['6'] !== undefined) setWeekendLimit(days['6']);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchLimits();
    }
  }, [childId]);

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${baseUrl}/monitoring/limits/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyMinutesLimit: dailyMinutes,
          categoryLimitsJson: {
            Gaming: gamingLimit,
            Entertainment: entertainmentLimit,
            'Social & Chat': socialLimit,
          },
          dayOfWeekLimitsJson: {
            '1': weekdayLimit,
            '2': weekdayLimit,
            '3': weekdayLimit,
            '4': weekdayLimit,
            '5': weekendLimit,
            '6': weekendLimit,
            '0': weekendLimit,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        fetchLimits();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="ml-2 text-xs">Loading screen time rules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Screen Time Rules & Caps</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure daily allowances, per-category caps, and weekday vs weekend schedules.
          </p>
        </div>

        <button
          onClick={handleSaveLimits}
          disabled={saving}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition shadow-lg flex items-center gap-2 ${
            saveSuccess
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-50'
          }`}
        >
          {saveSuccess ? (
            <>
              <Check size={15} /> Settings Saved
            </>
          ) : saving ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Saving Rules...
            </>
          ) : (
            <>
              <Save size={15} /> Save Rules
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSaveLimits} className="space-y-6">
        {/* Global Daily Cap */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-amber-400" /> Global Daily Cap
              </h4>
              <p className="text-xs text-slate-400">Total allowed screen time across all paired devices per day</p>
            </div>
            <span className="text-base font-bold text-amber-400 font-mono">
              {Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60 > 0 ? `${dailyMinutes % 60}m` : ''}
            </span>
          </div>

          <input
            type="range"
            min={30}
            max={480}
            step={15}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>30 mins</span>
            <span>4 hours</span>
            <span>8 hours</span>
          </div>
        </div>

        {/* Category Caps */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl space-y-5">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders size={16} className="text-amber-400" /> Category-Specific Limits
            </h4>
            <p className="text-xs text-slate-400">Restrict entertainment and games while keeping educational tools unhindered</p>
          </div>

          <div className="space-y-4">
            {/* Gaming Limit */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Gamepad2 size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Gaming (Minecraft, Steam, Roblox)</span>
                  <span className="text-[10px] text-slate-500">Daily limit for game applications</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={300}
                  step={15}
                  value={gamingLimit}
                  onChange={(e) => setGamingLimit(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
                <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>

            {/* Entertainment Limit */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Tv size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Entertainment (YouTube, Netflix)</span>
                  <span className="text-[10px] text-slate-500">Daily streaming and video cap</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={300}
                  step={15}
                  value={entertainmentLimit}
                  onChange={(e) => setEntertainmentLimit(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
                <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>

            {/* Social Media Limit */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Social & Chat (Discord, TikTok)</span>
                  <span className="text-[10px] text-slate-500">Social interaction and messaging cap</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={300}
                  step={15}
                  value={socialLimit}
                  onChange={(e) => setSocialLimit(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
                <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Day-of-Week Schedule (School Days vs Weekends) */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" /> Schedule Variations
            </h4>
            <p className="text-xs text-slate-400">Differentiate allowances between school days and weekends</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold text-slate-200 block mb-1">School Days (Mon – Thu)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={30}
                  max={360}
                  step={15}
                  value={weekdayLimit}
                  onChange={(e) => setWeekdayLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
                <span className="text-xs text-slate-400 shrink-0">mins</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold text-slate-200 block mb-1">Weekends (Fri – Sun)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={30}
                  max={480}
                  step={15}
                  value={weekendLimit}
                  onChange={(e) => setWeekendLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
                <span className="text-xs text-slate-400 shrink-0">mins</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
