import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Habit } from '@tracker/shared';

interface HabitsViewProps {
  token: string;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ token }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchHabitsAndHeatmap = async () => {
    setLoading(true);
    try {
      const [habitsRes, heatmapRes] = await Promise.all([
        fetch(`${baseUrl}/habits?date=${todayStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/habits/heatmap?days=90${selectedHabitId ? `&habitId=${selectedHabitId}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        setHabits(data);
      }

      if (heatmapRes.ok) {
        const data = await heatmapRes.json();
        setHeatmap(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsAndHeatmap();
  }, [selectedHabitId]);

  const openCreateModal = () => {
    setEditingHabit(null);
    setName('');
    setFrequency('daily');
    setTarget(1);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setName(habit.name);
    setFrequency(habit.frequency);
    setTarget(habit.target);
    setError('');
    setModalOpen(true);
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
      fetchHabitsAndHeatmap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${baseUrl}/habits/${habitId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHabitsAndHeatmap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const url = editingHabit ? `${baseUrl}/habits/${editingHabit.id}` : `${baseUrl}/habits`;
      const method = editingHabit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          frequency,
          target,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save habit');
      }

      setModalOpen(false);
      fetchHabitsAndHeatmap();
    } catch (err: any) {
      setError(err.message || 'Error saving habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`${baseUrl}/export/habits/csv`, '_blank');
  };

  // Generate 90-day heatmap grid array
  const generateHeatmapDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = heatmap[dateStr] || 0;
      days.push({ date: dateStr, count });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Habit Tracking & Streaks</h2>
          <p className="text-xs text-slate-400 mt-0.5">Build enduring disciplines with real completion analytics.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
            title="Export habit history to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Establish Habit
          </button>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar size={18} className="text-amber-400" /> 90-Day Habit Matrix
            </h3>
            <p className="text-xs text-slate-400">
              {selectedHabitId ? 'Showing completions for selected habit' : 'Combined completion intensity across all habits'}
            </p>
          </div>

          {selectedHabitId && (
            <button
              onClick={() => setSelectedHabitId(null)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
            >
              Reset to All Habits
            </button>
          )}
        </div>

        {/* Contribution-style Heatmap Grid */}
        <div className="pt-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
            {heatmapDays.map(({ date, count }) => {
              let bgClass = 'bg-slate-950 border border-slate-800/80';
              if (count === 1) bgClass = 'bg-emerald-500/40 border border-emerald-500/60';
              else if (count === 2) bgClass = 'bg-emerald-500/70 border border-emerald-500/80';
              else if (count >= 3) bgClass = 'bg-emerald-400 shadow-sm shadow-emerald-500/30';

              return (
                <div
                  key={date}
                  title={`${date}: ${count} completed log${count === 1 ? '' : 's'}`}
                  className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 ${bgClass}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800/60">
            <span>90 Days Ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-950 border border-slate-800" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading habits...</span>
        </div>
      ) : habits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Sparkles size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No habits tracked yet</h3>
          <p className="text-xs text-slate-500 mt-1">Start small by adding your first daily routine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habits.map((habit) => {
            const isSelected = selectedHabitId === habit.id;
            return (
              <div
                key={habit.id}
                onClick={() => setSelectedHabitId(isSelected ? null : habit.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/20 shadow-xl'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{habit.name}</h4>
                    <span className="text-[11px] text-slate-400 capitalize">{habit.frequency} routine</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => openEditModal(habit, e)}
                      className="p-1.5 text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-slate-800"
                      title="Edit Habit"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={(e) => handleDeleteHabit(habit.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-red-500/10"
                      title="Delete Habit"
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHabit(habit.id, !!habit.completedToday);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        habit.completedToday
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {habit.completedToday ? 'Done Today' : 'Mark Done'}
                    </button>
                  </div>
                </div>

                {/* Streak Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Flame size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Current Streak</p>
                      <p className="text-xs font-bold text-slate-200">{habit.currentStreak || 0} Days</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Record Streak</p>
                      <p className="text-xs font-bold text-slate-200">{habit.longestStreak || 0} Days</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Habit Modal */}
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
              <h3 className="text-lg font-bold text-white mb-4">
                {editingHabit ? 'Edit Habit' : 'Establish New Habit'}
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Habit Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning Run, Read 20 Pages, Hydration"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Saving...' : editingHabit ? 'Update Habit' : 'Save Habit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
