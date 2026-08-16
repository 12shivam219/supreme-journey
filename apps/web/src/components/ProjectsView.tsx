import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { Project, ProjectStatus } from '@tracker/shared';

interface ProjectsViewProps {
  token: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ token }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/projects?includeArchived=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor('#f59e0b');
    setStatus('active');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color || '#f59e0b');
    setStatus(p.status || 'active');
    setError('');
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const url = editingProject ? `${baseUrl}/projects/${editingProject.id}` : `${baseUrl}/projects`;
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          ...(editingProject ? { status } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save project');
      }

      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Error saving project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await fetch(`${baseUrl}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const colorPalette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FolderKanban size={14} />
            <span>Project Management</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Projects & Initiatives</h2>
          <p className="text-xs text-slate-400 mt-0.5">Organize high-level objectives and track task completion rates.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        {(['active', 'completed', 'archived', 'all'] as const).map((tab) => (
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

      {/* Project Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-xs">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <FolderKanban size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No {filter} projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Create a new project to group and organize related tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const progress = project.progressPercentage || 0;
            return (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl backdrop-blur-md flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: project.color || '#f59e0b' }}
                      />
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{project.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(project, e)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition rounded-lg hover:bg-slate-800"
                        title="Edit Project"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                        title="Delete Project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar & Task Counts */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      {project.completedTaskCount || 0} / {project.taskCount || 0} Tasks
                    </span>
                    <span className="text-amber-400 font-bold">{progress}%</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: project.color || '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
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
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Home Remodel, College Prep, Health Reset"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project scope and success criteria..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
                  <div className="flex items-center gap-2 pt-1">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                          color === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check size={12} className="text-slate-950 font-bold" />}
                      </button>
                    ))}
                  </div>
                </div>

                {editingProject && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60 capitalize"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
