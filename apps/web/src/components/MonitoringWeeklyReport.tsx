import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { WeeklyReportResponse } from '@tracker/shared';

interface MonitoringWeeklyReportProps {
  childId: string;
  token: string;
  selectedDate: string;
}

export const MonitoringWeeklyReport: React.FC<MonitoringWeeklyReportProps> = ({
  childId,
  token,
  selectedDate,
}) => {
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/monitoring/weekly?childId=${childId}&date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchWeeklyReport();
    }
  }, [childId, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="ml-2 text-xs">Computing 7-day screen time analytics...</span>
      </div>
    );
  }

  if (!report) return null;

  const thisWeekHours = (report.totalMinutesThisWeek / 60).toFixed(1);
  const lastWeekHours = (report.totalMinutesLastWeek / 60).toFixed(1);

  // Transform daily minutes into hours for clean Bar chart rendering
  const chartData = report.dailyBreakdown.map((item) => ({
    name: item.dayOfWeek,
    date: item.date,
    'This Week': parseFloat((item.minutesThisWeek / 60).toFixed(1)),
    'Last Week': parseFloat((item.minutesLastWeek / 60).toFixed(1)),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Week-over-Week Stats */}
      <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Calendar size={13} />
            7-Day Analytical Report ({report.dateRange.start} – {report.dateRange.end})
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">Weekly Activity & Category Intelligence</h3>
          <p className="text-xs text-slate-400 mt-0.5">Objective usage trends comparing this week to the previous week.</p>
        </div>

        {/* Change Metric Pill */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Usage</span>
            <span className="text-lg font-bold text-white">{thisWeekHours} hrs</span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">vs Last Week</span>
            <div className="flex items-center gap-1">
              {report.percentageChange <= 0 ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center">
                  <TrendingDown size={14} className="mr-0.5" />
                  {Math.abs(report.percentageChange)}%
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-400 flex items-center">
                  <TrendingUp size={14} className="mr-0.5" />
                  +{report.percentageChange}%
                </span>
              )}
              <span className="text-[10px] text-slate-500">({lastWeekHours}h)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Grid (2 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Screen Time Comparison Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-amber-400" /> Daily Screen Time (Hours)
          </h4>
          <p className="text-xs text-slate-400 mb-6">Daily hours active compared against last week</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#F1F5F9',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar dataKey="This Week" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Last Week" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* App Category Breakdown Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <PieIcon size={16} className="text-emerald-400" /> Category Breakdown
            </h4>
            <p className="text-xs text-slate-400 mb-4">Distribution by app purpose</p>

            {report.categoryBreakdown.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                No categorized usage recorded this week.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="minutes"
                      nameKey="category"
                    >
                      {report.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${Math.round(Number(value))} mins`, 'Duration']}
                      contentStyle={{
                        backgroundColor: '#090D16',
                        borderColor: '#1E293B',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        color: '#F1F5F9',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Legend List */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800/80">
            {report.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300 font-medium truncate">{cat.category}</span>
                <span className="text-slate-500 ml-auto font-mono">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
