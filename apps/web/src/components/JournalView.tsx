import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Save,
  Check,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react';
import { JournalEntry } from '@tracker/shared';

interface JournalViewProps {
  token: string;
}

export const JournalView: React.FC<JournalViewProps> = ({ token }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Load entry for selected date
  const fetchEntryForDate = async (dateStr: string) => {
    setLoadingDate(true);
    try {
      const res = await fetch(`${baseUrl}/journal/date/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
      } else {
        setContent('');
      }
    } catch (err) {
      console.error(err);
      setContent('');
    } finally {
      setLoadingDate(false);
    }
  };

  // Perform journal entries search
  const performSearch = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`${baseUrl}/journal/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchEntryForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  const handleSaveEntry = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch(`${baseUrl}/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          content,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
        performSearch(searchQuery);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      await fetch(`${baseUrl}/journal/date/${selectedDate}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setContent('');
      performSearch(searchQuery);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Lock size={13} />
            <span>Private Reflections</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Daily Journal & Reflections</h2>
          <p className="text-xs text-slate-400 mt-0.5">Mindful daily entries, encrypted and searchable across time.</p>
        </div>

        {/* Date Selector & Save Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <button
            onClick={handleSaveEntry}
            disabled={saving || loadingDate}
            className={`py-2 px-4 rounded-xl font-semibold text-xs transition shadow-lg flex items-center gap-2 ${
              savedSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-50'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar size={14} className="text-amber-400" />
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>

              {content && (
                <button
                  onClick={handleDeleteEntry}
                  className="text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete Entry
                </button>
              )}
            </div>

            {loadingDate ? (
              <div className="h-96 flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="ml-2 text-xs">Loading reflection...</span>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your mindful reflections, thoughts, or wins for the day here..."
                rows={16}
                className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 leading-relaxed resize-none transition"
              />
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800/60">
              <span>{content.split(/\s+/).filter(Boolean).length} Words</span>
              <span>Encrypted User Storage</span>
            </div>
          </div>
        </div>

        {/* Search & History Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Search size={16} className="text-amber-400" /> Search Journal History
            </h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past reflections..."
                className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            </div>

            {/* Results List */}
            {searching ? (
              <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-amber-500" /> Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800/60">
                {searchQuery ? 'No matching reflections found.' : 'No past reflections found.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {searchResults.map((entry) => {
                  const isCurrent = entry.date === selectedDate;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedDate(entry.date as string)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-200">{entry.date as string}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
