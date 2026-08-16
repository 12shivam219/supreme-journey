import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Smile,
  Meh,
  Frown,
  Sparkles,
  ArrowRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { DailySummaryResponse } from '@tracker/shared';

interface TodayDashboardProps {
  summary: DailySummaryResponse | null;
  loading: boolean;
  onRefresh: () => void;
  token: string;
  onNavigateTab: (tab: 'tasks' | 'habits' | 'journal') => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  summary,
  loading,
  onRefresh,
  token,
  onNavigateTab,
}) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [loggingMood, setLoggingMood] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(summary?.mood?.todayScore || null);
  const [moodNote, setMoodNote] = useState(summary?.mood?.todayNote || '');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleTask = async (taskId: string) => {
    try {
      await fetch(`${baseUrl}/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: quickTaskTitle.trim(),
          dueDate: todayStr,
          priority: 'medium',
        }),
      });
      setQuickTaskTitle('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleHabit = async (habitId: string, currentCompleted: boolean) => {
    try {
      await fetch(`${baseUrl}/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: todayStr,
          completed: !currentCompleted,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMood = async (score: number) => {
    setSelectedScore(score);
    setLoggingMood(true);
    try {
      await fetch(`${baseUrl}/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: todayStr,
          moodScore: score,
          note: moodNote.trim() || undefined,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingMood(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-sm">Loading your daily dashboard...</span>
      </div>
    );
  }

  const tasks = summary?.tasks?.items || [];
  const habits = summary?.habits?.items || [];
  const completionRate = summary?.habits?.completionPercentage || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Date Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Today at a Glance</h2>
          <p className="text-slate-400 text-xs mt-0.5">Stay centered with your personal habits, tasks, and daily mindfulness.</p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Habit Score</p>
              <p className="text-sm font-bold text-emerald-400">{completionRate}%</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tasks Done</p>
              <p className="text-sm font-bold text-amber-400">
                {summary?.tasks.completed || 0}/{summary?.tasks.total || 0}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Tasks & Quick Add (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Tasks Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-amber-400" /> Today's Focus
                </h3>
                <p className="text-xs text-slate-400">Action items and auto-generated recurring routines</p>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
              >
                All Tasks <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick-Add Input */}
            <form onSubmit={handleQuickAddTask} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Add a task for today (Press Enter)..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition"
                />
                <button
                  type="submit"
                  disabled={addingTask || !quickTaskTitle.trim()}
                  className="absolute right-2.5 top-2.5 p-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 transition"
                >
                  <Plus size={16} />
                </button>
              </div>
            </form>

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
                <p className="text-xs text-slate-400 font-medium">All clear for today!</p>
                <p className="text-[11px] text-slate-500 mt-1">Use the input above to plan out your day.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        isCompleted
                          ? 'bg-slate-950/30 border-slate-800/40 text-slate-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          type="button"
                          className="shrink-0 text-amber-400 hover:text-amber-300 transition"
                        >
                          {isCompleted ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                        </button>
                        <span className={`text-xs font-medium truncate ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.recurrenceRule && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 capitalize">
                            {task.recurrenceRule}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7-Day Habit Tracker Grid */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Flame size={18} className="text-orange-400" /> Active Habits (7-Day View)
                </h3>
                <p className="text-xs text-slate-400">Click circle to toggle today's completion</p>
              </div>
              <button
                onClick={() => onNavigateTab('habits')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
              >
                Manage Habits <ArrowRight size={14} />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
                <p className="text-xs text-slate-400 font-medium">No habits configured yet</p>
                <p className="text-[11px] text-slate-500 mt-1">Visit the Habits tab to establish your positive daily routines.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{habit.name}</h4>
                        {habit.currentStreak ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                            <Flame size={12} /> {habit.currentStreak}d
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-500 capitalize">{habit.frequency}</span>
                    </div>

                    {/* 7-Day interactive dots */}
                    <div className="flex items-center gap-2">
                      {habit.weeklyLogs?.map((log, idx) => {
                        const isToday = idx === (habit.weeklyLogs?.length || 0) - 1;
                        return (
                          <div
                            key={log.date}
                            onClick={isToday ? () => handleToggleHabit(habit.id, log.completed) : undefined}
                            title={`${log.date}: ${log.completed ? 'Completed' : 'Missed'}${isToday ? ' (Click to toggle)' : ''}`}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                              log.completed
                                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                                : 'bg-slate-800/80 text-slate-500 hover:border hover:border-slate-700'
                            } ${isToday ? 'cursor-pointer ring-1 ring-amber-400/50 hover:scale-105' : 'cursor-default'}`}
                          >
                            {log.completed ? '✓' : log.date.split('-')[2]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mood Check-in & Journal Teaser (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mood Check-In Widget */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
              <Smile size={18} className="text-amber-400" /> Daily Mood Check-In
            </h3>
            <p className="text-xs text-slate-400 mb-5">How are you feeling today?</p>

            {/* Mood Scores 1 - 5 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { score: 1, label: 'Low', icon: Frown, color: 'text-red-400' },
                { score: 2, label: 'Down', icon: Frown, color: 'text-orange-400' },
                { score: 3, label: 'Neutral', icon: Meh, color: 'text-yellow-400' },
                { score: 4, label: 'Good', icon: Smile, color: 'text-emerald-400' },
                { score: 5, label: 'Great', icon: Sparkles, color: 'text-cyan-400' },
              ].map(({ score, label, icon: Icon, color }) => {
                const isSelected = selectedScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    disabled={loggingMood}
                    onClick={() => handleSaveMood(score)}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10 scale-105'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-amber-300' : color} />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional mood note */}
            <div>
              <input
                type="text"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                onBlur={() => selectedScore && handleSaveMood(selectedScore)}
                placeholder="Optional daily note or reflection..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* 7-Day Trend Visual */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                7-Day Mood Trend
              </span>
              <div className="flex items-end justify-between h-16 px-1">
                {summary?.mood?.trend7Days?.map((item) => {
                  const heightPercent = item.moodScore > 0 ? (item.moodScore / 5) * 100 : 8;
                  const dayName = new Date(item.date).toLocaleDateString(undefined, { weekday: 'narrow' });
                  return (
                    <div key={item.date} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full max-w-[20px] bg-slate-950 rounded-t-md h-12 flex items-end justify-center p-0.5">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            item.moodScore >= 4
                              ? 'bg-emerald-400'
                              : item.moodScore === 3
                              ? 'bg-amber-400'
                              : item.moodScore > 0
                              ? 'bg-red-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Journal Prompt Teaser */}
          <div
            onClick={() => onNavigateTab('journal')}
            className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-amber-500/40 shadow-xl cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Private Journal</span>
              <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Write today's journal reflection</h4>
            <p className="text-xs text-slate-400">Capture thoughts, mindful takeaways, and milestones in your private encrypted journal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
