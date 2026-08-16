import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Calendar,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Goal, GoalCategory, GoalStatus } from '@tracker/shared';

interface GoalsViewProps {
  token: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ token }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Personal');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [currentValue, setCurrentValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [milestonesInput, setMilestonesInput] = useState<string[]>(['']);
  const [status, setStatus] = useState<GoalStatus>('in_progress');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setTargetValue('');
    setCurrentValue('');
    setUnit('');
    setDeadline('');
    setMilestonesInput(['']);
    setStatus('in_progress');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (g: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setCategory(g.category || 'Personal');
    setTargetValue(g.targetValue || '');
    setCurrentValue(g.currentValue || '');
    setUnit(g.unit || '');
    setDeadline(g.deadline ? (g.deadline as string).split('T')[0] : '');
    setStatus(g.status || 'in_progress');
    setError('');
    setModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const url = editingGoal ? `${baseUrl}/goals/${editingGoal.id}` : `${baseUrl}/goals`;
      const method = editingGoal ? 'PUT' : 'POST';

      const validMilestones = milestonesInput
        .map((m) => m.trim())
        .filter(Boolean)
        .map((m) => ({ title: m }));

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          targetValue: targetValue === '' ? undefined : Number(targetValue),
          currentValue: currentValue === '' ? undefined : Number(currentValue),
          unit: unit.trim() || undefined,
          deadline: deadline || undefined,
          ...(editingGoal ? { status } : { milestones: validMilestones }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save goal');
      }

      setModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      setError(err.message || 'Error saving goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await fetch(`${baseUrl}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${baseUrl}/goals/${goalId}/milestones/${milestoneId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const categories: (GoalCategory | 'all')[] = ['all', 'Health', 'Career', 'Family', 'Finance', 'Learning', 'Personal'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Target size={14} />
            <span>Aspirations & Targets</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Goals & Milestones</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track multi-step milestones, progress metrics, and life ambitions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              selectedCategory === cat
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading goals...</span>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Target size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No goals found</h3>
          <p className="text-xs text-slate-500 mt-1">Set a measurable target or milestone roadmap to level up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const progress = goal.progressPercentage || 0;
            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl backdrop-blur-md flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {goal.category}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{goal.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(goal, e)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 transition rounded-lg hover:bg-slate-800"
                        title="Edit Goal"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteGoal(goal.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {goal.description}
                    </p>
                  )}

                  {/* Measurable Progress Metric if targetValue exists */}
                  {goal.targetValue ? (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Metric Target</span>
                      <span className="text-amber-300 font-bold">
                        {goal.currentValue || 0} / {goal.targetValue} {goal.unit || ''}
                      </span>
                    </div>
                  ) : null}

                  {/* Milestones Checklist */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                        Milestone Steps
                      </span>
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={(e) => handleToggleMilestone(goal.id, m.id, m.completed, e)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition text-xs"
                        >
                          <button type="button" className="text-amber-400">
                            {m.completed ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Circle size={15} />}
                          </button>
                          <span className={`text-slate-300 font-medium truncate ${m.completed ? 'line-through text-slate-500' : ''}`}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Bar & Deadline */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 flex items-center gap-1">
                      {goal.deadline && (
                        <>
                          <Calendar size={12} className="text-amber-400" />
                          Target: {new Date(goal.deadline).toLocaleDateString()}
                        </>
                      )}
                    </span>
                    <span className="text-emerald-400 font-bold">{progress}% Completed</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
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
                {editingGoal ? 'Edit Goal' : 'Establish New Goal'}
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveGoal} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Run half marathon, Save $5,000, Read 12 books"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="Health">Health</option>
                    <option value="Career">Career</option>
                    <option value="Family">Family</option>
                    <option value="Finance">Finance</option>
                    <option value="Learning">Learning</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current</label>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target</label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="km, $, hrs"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                {!editingGoal && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Milestone Steps (Optional)
                    </label>
                    {milestonesInput.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={m}
                          onChange={(e) => {
                            const newM = [...milestonesInput];
                            newM[idx] = e.target.value;
                            setMilestonesInput(newM);
                          }}
                          placeholder={`Milestone ${idx + 1}...`}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMilestonesInput([...milestonesInput, ''])}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      + Add another milestone step
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-3"
                >
                  {submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
