import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { DailySummaryResponse, DailyReviewSummaryDTO } from '@tracker/shared';

interface DailyReviewModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummaryResponse | null;
  onRefreshData?: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  token,
  isOpen,
  onClose,
  summary,
  onRefreshData,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reviewSynthesis, setReviewSynthesis] = useState<DailyReviewSummaryDTO | null>(null);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      fetchDailyReviewSynthesis();
    }
  }, [isOpen]);

  const fetchDailyReviewSynthesis = async () => {
    setLoadingSynthesis(true);
    try {
      const res = await fetch(`${baseUrl}/ai/daily-review?date=${todayStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviewSynthesis(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSynthesis(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!journalText.trim()) return;
    setSavingJournal(true);
    try {
      await fetch(`${baseUrl}/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: todayStr,
          content: journalText.trim(),
        }),
      });
      setJournalSaved(true);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingJournal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0D1322] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
        {/* Header with Step Indicator */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <Sparkles size={13} />
              Evening Reflection Wizard • Step {step} of 4
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {step === 1 && '1. Today’s Completed Duties'}
              {step === 2 && '2. Habits & Streaks Momentum'}
              {step === 3 && '3. Mindful Journal Reflection'}
              {step === 4 && '4. Tomorrow’s Strategic Focus'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 min-h-[300px] max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                Review what you achieved today. Celebrate completions and prepare remaining items for rollover.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {summary?.tasks.completed || 0}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Tasks Completed</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-2xl font-extrabold text-amber-400">
                    {summary?.tasks.pending || 0}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Pending Rollovers</p>
                </div>
              </div>

              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                {summary?.tasks.items.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className={`font-medium ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {t.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                Consistent habits compound into life-changing mastery. Here is your habit performance today:
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Daily Habit Score</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {summary?.habits.completionPercentage || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Flame size={24} />
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {summary?.habits.items.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{h.name}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
                      <Flame size={12} /> {h.currentStreak || 0}d streak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-400 leading-relaxed">
                Take two minutes to write down your mindful takeaways, gratitude, or key learnings from today:
              </p>

              <textarea
                rows={6}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="What went well today? What will you do better tomorrow?"
                className="w-full p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">AES-256 encrypted at rest</span>
                <button
                  type="button"
                  onClick={handleSaveReflection}
                  disabled={savingJournal || !journalText.trim()}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {journalSaved ? (
                    <>
                      <Check size={14} className="text-emerald-400" /> Saved
                    </>
                  ) : savingJournal ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save to Journal'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              {loadingSynthesis ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="ml-2 text-xs">Synthesizing evening review...</span>
                </div>
              ) : reviewSynthesis ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                    {reviewSynthesis.reflectionSummary}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white mb-2">Recommended Focus for Tomorrow:</h4>
                    <ul className="space-y-2">
                      {reviewSynthesis.suggestedFocusForTomorrow.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 font-medium"
                        >
                          <CheckCircle2 size={15} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}
            disabled={step === 1}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-20 transition flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((prev) => Math.min(4, prev + 1) as any)}
              className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              Finish Review <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
