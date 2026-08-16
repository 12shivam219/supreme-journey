import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  BookOpen,
  Monitor,
  ShieldAlert,
  UserPlus,
  QrCode,
  LogOut,
  LogIn,
  UserCheck,
  Sun,
  FolderKanban,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal.tsx';
import { AddChildModal } from './components/AddChildModal.tsx';
import { DevicePairingModal } from './components/DevicePairingModal.tsx';
import { TodayDashboard } from './components/TodayDashboard.tsx';
import { TasksView } from './components/TasksView.tsx';
import { HabitsView } from './components/HabitsView.tsx';
import { JournalView } from './components/JournalView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { GoalsView } from './components/GoalsView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { AIAssistantDrawer } from './components/AIAssistantDrawer.tsx';
import { DailyReviewModal } from './components/DailyReviewModal.tsx';
import { MonitoringDashboard } from './components/MonitoringDashboard.tsx';
import { User, DailySummaryResponse } from '@tracker/shared';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'today' | 'tasks' | 'projects' | 'calendar' | 'goals' | 'habits' | 'journal' | 'dashboard' | 'monitoring'
  >('today');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);

  // Daily Summary state
  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Modals & Drawers state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchChildren = async (authToken: string) => {
    try {
      const res = await fetch(`${baseUrl}/family/children`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChildrenList(data);
      }
    } catch (err) {
      console.error('[Error fetching children]', err);
    }
  };

  const fetchDailySummary = async (authToken: string) => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${baseUrl}/summary/daily`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDailySummary(data);
      }
    } catch (err) {
      console.error('[Error fetching daily summary]', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetch(`${baseUrl}/auth/refresh`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.accessToken && data?.user) {
          setToken(data.accessToken);
          setUser(data.user);
          fetchChildren(data.accessToken);
          fetchDailySummary(data.accessToken);
        }
      })
      .catch(() => {});
  }, []);

  const handleAuthSuccess = (accessToken: string, loggedInUser: User) => {
    setToken(accessToken);
    setUser(loggedInUser);
    fetchChildren(accessToken);
    fetchDailySummary(accessToken);
  };

  const handleLogout = async () => {
    await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
    setToken(null);
    setUser(null);
    setChildrenList([]);
    setDailySummary(null);
  };

  return (
    <div className="flex h-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans relative">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0D1322] border-r border-slate-800/80 p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-lg text-slate-950 shadow-lg shadow-amber-500/20">
              T
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-white tracking-tight">Tracker</h1>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">LifeOS & Safety</span>
            </div>
          </div>

          {/* Daily Review Quick Launch */}
          {user && token && (
            <button
              onClick={() => setDailyReviewOpen(true)}
              className="w-full mb-5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Evening Review Wizard</span>
            </button>
          )}

          {/* Section: Personal Growth & Productivity */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Personal Growth
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('today')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'today'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Sun size={15} className={activeTab === 'today' ? 'text-amber-400' : 'text-slate-400'} />
                Today Focus
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'tasks'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <CheckSquare size={15} className={activeTab === 'tasks' ? 'text-amber-400' : 'text-slate-400'} />
                Tasks & Todos
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'projects'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FolderKanban size={15} className={activeTab === 'projects' ? 'text-amber-400' : 'text-slate-400'} />
                Projects
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Calendar size={15} className={activeTab === 'calendar' ? 'text-blue-400' : 'text-slate-400'} />
                Calendar
              </button>

              <button
                onClick={() => setActiveTab('goals')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'goals'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Target size={15} className={activeTab === 'goals' ? 'text-emerald-400' : 'text-slate-400'} />
                Goals & Milestones
              </button>

              <button
                onClick={() => setActiveTab('habits')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'habits'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Flame size={15} className={activeTab === 'habits' ? 'text-orange-400' : 'text-slate-400'} />
                Habits & Streaks
              </button>

              <button
                onClick={() => setActiveTab('journal')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'journal'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <BookOpen size={15} className={activeTab === 'journal' ? 'text-amber-400' : 'text-slate-400'} />
                Private Journal
              </button>
            </nav>
          </div>

          {/* Section: Family Safety */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Family & Devices
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard size={15} />
                Parent Dashboard
              </button>

              <button
                onClick={() => setActiveTab('monitoring')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'monitoring'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Monitor size={15} />
                Device Activity
              </button>
            </nav>
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          {user ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UserCheck size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-red-400 text-[10px] font-medium transition flex items-center justify-center gap-1.5"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <LogIn size={15} /> Sign In / Register
            </button>
          )}

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Database Live (PostgreSQL)</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-[#090D16] via-[#0D1322] to-[#090D16] relative">
        {/* Render Guard: Require Authentication */}
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl">
              <Sun size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to Tracker LifeOS</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in or create a parent account to start tracking habits, tasks, projects, calendar, goals, mood, and family devices.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
            >
              Get Started Now
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'today' && token && (
              <TodayDashboard
                summary={dailySummary}
                loading={loadingSummary}
                onRefresh={() => fetchDailySummary(token)}
                token={token}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'tasks' && token && <TasksView token={token} />}

            {activeTab === 'projects' && token && <ProjectsView token={token} />}

            {activeTab === 'calendar' && token && <CalendarView token={token} />}

            {activeTab === 'goals' && token && <GoalsView token={token} />}

            {activeTab === 'habits' && token && <HabitsView token={token} />}

            {activeTab === 'journal' && token && <JournalView token={token} />}

            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Parent Dashboard</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Family safety, registered children, and activity monitoring.</p>
                  </div>

                  <button
                    onClick={() => setAddChildModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Add Child Profile
                  </button>
                </header>

                {/* Quick Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Children Profiles</span>
                      <UserCheck size={20} className="text-emerald-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-white">{childrenList.length}</span>
                    <p className="text-xs text-slate-500 mt-2">Active family members</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Paired Devices</span>
                      <Monitor size={20} className="text-cyan-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-white">
                      {childrenList.reduce((acc, curr) => acc + (curr.devices?.length || 0), 0)}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">Windows & Android agent instances</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Safety Status</span>
                      <ShieldAlert size={20} className="text-amber-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-white">Normal</span>
                    <p className="text-xs text-slate-500 mt-2">No active security alerts</p>
                  </div>
                </div>

                {/* Children List */}
                <section>
                  <h3 className="text-base font-bold text-white mb-4">Family Profiles & Devices</h3>
                  {childrenList.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400">
                      No child profiles created yet. Click "Add Child Profile" above to create your first child profile.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {childrenList.map((child) => (
                        <div key={child.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-amber-400">
                                {child.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-base">{child.name}</h4>
                                <p className="text-xs text-slate-400">Age: {child.age || 'Not specified'}</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-6">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Connected Devices</span>
                              {child.devices && child.devices.length > 0 ? (
                                child.devices.map((dev: any) => (
                                  <div key={dev.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-300 font-medium">{dev.deviceName} ({dev.type})</span>
                                    <span className="text-[10px] text-slate-500">Last seen {new Date(dev.lastSeen).toLocaleTimeString()}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-500 italic">No devices paired yet.</p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedChild({ id: child.id, name: child.name });
                              setPairingModalOpen(true);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition flex items-center justify-center gap-2"
                          >
                            <QrCode size={16} /> Pair New Device
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'monitoring' && token && (
              <MonitoringDashboard
                token={token}
                childrenList={childrenList}
              />
            )}
          </>
        )}

        {/* Floating AI Assistant Trigger Button */}
        {user && token && (
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-2xl shadow-amber-500/30 transition-transform hover:scale-105 flex items-center gap-2"
            title="Open AI Assistant"
          >
            <Sparkles size={18} />
            <span className="text-xs font-extrabold pr-1">AI Assistant</span>
          </button>
        )}
      </main>

      {/* Floating AI Assistant Drawer */}
      {token && (
        <AIAssistantDrawer
          token={token}
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          onRefreshData={() => fetchDailySummary(token)}
        />
      )}

      {/* Daily Review Reflection Wizard Modal */}
      {token && (
        <DailyReviewModal
          token={token}
          isOpen={dailyReviewOpen}
          onClose={() => setDailyReviewOpen(false)}
          summary={dailySummary}
          onRefreshData={() => fetchDailySummary(token)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Add Child Modal */}
      {token && (
        <AddChildModal
          isOpen={addChildModalOpen}
          token={token}
          onClose={() => setAddChildModalOpen(false)}
          onChildAdded={() => fetchChildren(token)}
        />
      )}

      {/* Device Pairing Modal */}
      {token && selectedChild && (
        <DevicePairingModal
          isOpen={pairingModalOpen}
          childName={selectedChild.name}
          childId={selectedChild.id}
          token={token}
          onClose={() => {
            setPairingModalOpen(false);
            fetchChildren(token);
          }}
        />
      )}
    </div>
  );
}
