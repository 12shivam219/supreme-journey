import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Repeat,
  AlertCircle,
  X,
  Loader2,
  Search,
  Download,
} from 'lucide-react';
import { Task, TaskPriority, Project } from '@tracker/shared';

interface TasksViewProps {
  token: string;
}

export const TasksView: React.FC<TasksViewProps> = ({ token }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrenceRule, setRecurrenceRule] = useState<string>('');
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchTasksAndProjects = async () => {
    setLoading(true);
    try {
      const projectParam = selectedProjectId ? `&projectId=${selectedProjectId}` : '';
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${baseUrl}/tasks?filter=${filter}${projectParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
      }
      if (projectsRes.ok) {
        const pData = await projectsRes.json();
        setProjects(pData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProjects();
  }, [filter, selectedProjectId]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setRecurrenceRule('');
    setTaskProjectId(selectedProjectId || '');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate ? (task.dueDate as string).split('T')[0] : '');
    setPriority(task.priority);
    setRecurrenceRule(task.recurrenceRule || '');
    setTaskProjectId(task.projectId || '');
    setError('');
    setModalOpen(true);
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await fetch(`${baseUrl}/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasksAndProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${baseUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasksAndProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const url = editingTask ? `${baseUrl}/tasks/${editingTask.id}` : `${baseUrl}/tasks`;
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || null,
          priority,
          recurrenceRule: recurrenceRule || null,
          projectId: taskProjectId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save task');
      }

      setModalOpen(false);
      fetchTasksAndProjects();
    } catch (err: any) {
      setError(err.message || 'Error saving task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`${baseUrl}/export/tasks/csv`, '_blank');
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Tasks & Recurrence Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage one-off todos and automated recurring routines.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
            title="Export tasks to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* Filter Tabs, Search & Project Select */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['all', 'today', 'overdue', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === tab
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2.5">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 w-48"
            />
            <Search size={13} className="absolute left-2.5 top-2 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <CheckCircle2 size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1">Create a new task to organize your upcoming duties.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition group ${
                  isCompleted
                    ? 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5 overflow-hidden">
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-amber-400 hover:text-amber-300 transition"
                  >
                    {isCompleted ? <CheckCircle2 size={19} className="text-emerald-400" /> : <Circle size={19} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-semibold leading-snug ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </h4>
                      {task.project && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold text-slate-950"
                          style={{ backgroundColor: task.project.color || '#f59e0b' }}
                        >
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-amber-400" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.recurrenceRule && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Repeat size={11} />
                          Repeats {task.recurrenceRule}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      task.priority === 'urgent'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'high'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={(e) => openEditModal(task, e)}
                    className="p-1.5 text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-slate-800"
                    title="Edit task"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-red-500/10"
                    title="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
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
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Pay utility bills, Review math assignment"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional context or notes..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                {projects.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assign to Project (Optional)</label>
                    <select
                      value={taskProjectId}
                      onChange={(e) => setTaskProjectId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    >
                      <option value="">No Project (Independent Task)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60 capitalize"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recurrence Routine</label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="">None (One-off Task)</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
