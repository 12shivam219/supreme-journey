export type UserRole = 'parent' | 'child';
export type DeviceType = 'windows' | 'android';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  age?: number | null;
  avatar?: string | null;
  createdAt: Date | string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CreateChildDTO {
  name: string;
  age?: number;
  avatar?: string;
}

export interface PairingCodeResponse {
  pairingCode: string;
  expiresAt: Date | string;
  qrPayload: string;
}

export interface DevicePairDTO {
  pairingCode: string;
  deviceName: string;
  type: DeviceType;
}

export interface DevicePairResponse {
  deviceId: string;
  deviceToken: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface FamilyLink {
  parentId: string;
  childId: string;
}

export interface Device {
  id: string;
  childId: string;
  type: DeviceType;
  deviceName: string;
  lastSeen: Date | string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: string;
  target: number;
  archived?: boolean;
  createdAt?: Date | string;
  currentStreak?: number;
  longestStreak?: number;
  completedToday?: boolean;
  weeklyLogs?: { date: string; completed: boolean }[];
}

export interface CreateHabitDTO {
  name: string;
  frequency?: string;
  target?: number;
}

export interface UpdateHabitDTO {
  name?: string;
  frequency?: string;
  target?: number;
  archived?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date | string;
  completed: boolean;
  note?: string | null;
}

export interface ToggleHabitLogDTO {
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
}

export interface HabitHeatmapDay {
  date: string;
  count: number;
  completed: boolean;
}

export interface MoodLog {
  id: string;
  userId: string;
  date: Date | string;
  moodScore: number;
  note?: string | null;
  createdAt?: Date | string;
}

export interface UpsertMoodDTO {
  date: string; // YYYY-MM-DD
  moodScore: number;
  note?: string;
}

export interface MoodTrendItem {
  date: string;
  moodScore: number;
  note?: string | null;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: Date | string;
  content: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UpsertJournalDTO {
  date: string; // YYYY-MM-DD
  content: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: Date | string | null;
  startDate?: Date | string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  recurrenceRule?: string | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string;
  parentTaskId?: string | null;
  project?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedMinutes?: number | null;
  projectId?: string | null;
  priority?: TaskPriority;
  recurrenceRule?: string | null;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  projectId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  recurrenceRule?: string | null;
}

export interface DailySummaryResponse {
  date: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    items: Task[];
  };
  habits: {
    total: number;
    completed: number;
    completionPercentage: number;
    items: Habit[];
  };
  mood: {
    todayScore: number | null;
    todayNote?: string | null;
    trend7Days: MoodTrendItem[];
  };
}

export interface ScreenTimeLimit {
  id: string;
  childId: string;
  dailyMinutesLimit: number;
  categoryLimitsJson?: Record<string, number> | null;
  dayOfWeekLimitsJson?: Record<string, number> | null;
  updatedAt?: Date | string;
}

export interface UpdateScreenTimeLimitDTO {
  dailyMinutesLimit?: number;
  categoryLimitsJson?: Record<string, number>;
  dayOfWeekLimitsJson?: Record<string, number>;
}

export interface MonitoringOverviewResponse {
  childId: string;
  childName: string;
  date: string;
  totalScreenTimeMinutes: number;
  dailyMinutesLimit: number;
  limitBreached: boolean;
  devices: {
    id: string;
    deviceName: string;
    type: DeviceType;
    lastSeen: Date | string;
    isOnline: boolean;
    todayMinutes: number;
  }[];
  topApps: {
    appName: string;
    minutes: number;
    percentage: number;
    category?: string;
  }[];
  recentAlert?: Alert | null;
}

export interface WeeklyReportResponse {
  childId: string;
  dateRange: { start: string; end: string };
  totalMinutesThisWeek: number;
  totalMinutesLastWeek: number;
  percentageChange: number;
  dailyBreakdown: {
    date: string;
    dayOfWeek: string;
    minutesThisWeek: number;
    minutesLastWeek: number;
  }[];
  categoryBreakdown: {
    category: string;
    minutes: number;
    percentage: number;
    color: string;
  }[];
}

export interface TimelineSession {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  appName: string;
  windowTitle?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  durationSeconds: number;
  durationMinutes: number;
  category: string;
}

export interface IngestSessionDTO {
  clientSessionId?: string;
  appName: string;
  windowTitle?: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export interface IngestAlertDTO {
  type: string;
  message: string;
}

export interface IngestScreenTimeDTO {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  byAppBreakdownJson: Record<string, number>;
}

export interface Alert {
  id: string;
  childId: string;
  type: string;
  message: string;
  triggeredAt: Date | string;
  acknowledged: boolean;
}

export interface Screenshot {
  id: string;
  deviceId: string;
  timestamp: Date | string;
  storageUrl: string;
}

export interface AppSession {
  id: string;
  deviceId: string;
  appName: string;
  windowTitle?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  durationSeconds?: number | null;
}

export interface IngestResponseDTO {
  success: boolean;
  limitBreached: boolean;
  usagePercentage: number;
  shouldEnforce: boolean;
  enforcementMode: 'none' | 'warning' | 'lock';
  message?: string;
}

export interface ActivityDigestDTO {
  childId: string;
  childName: string;
  period: 'daily' | 'weekly';
  dateRange: { start: string; end: string };
  totalScreenTimeMinutes: number;
  totalScreenTimeHours: string;
  topApps: { appName: string; minutes: number; percentage: number }[];
  alertsTriggeredCount: number;
  tasksCompletedCount: number;
  habitsCompletedCount: number;
}

export interface DeviceStatusEvent {
  deviceId: string;
  childId: string;
  deviceName: string;
  type: DeviceType;
  isOnline: boolean;
  lastSeen: string;
}

export interface LiveAlertEvent {
  id: string;
  childId: string;
  childName: string;
  type: string;
  message: string;
  triggeredAt: string;
}

export interface LiveSessionEvent {
  deviceId: string;
  childId: string;
  appName: string;
  windowTitle?: string | null;
  startTime: string;
}

// ----------------------------------------------------
// LifeOS: Projects
// ----------------------------------------------------
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status: ProjectStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
  taskCount?: number;
  completedTaskCount?: number;
  progressPercentage?: number;
  tasks?: Task[];
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
}

// ----------------------------------------------------
// LifeOS: Goals & Milestones
// ----------------------------------------------------
export type GoalStatus = 'in_progress' | 'completed' | 'abandoned';
export type GoalCategory = 'Health' | 'Career' | 'Family' | 'Finance' | 'Learning' | 'Personal';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  dueDate?: Date | string | null;
  createdAt?: Date | string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category: GoalCategory;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  deadline?: Date | string | null;
  status: GoalStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
  progressPercentage?: number;
  milestones?: Milestone[];
}

export interface CreateMilestoneDTO {
  title: string;
  dueDate?: string | null;
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  category?: GoalCategory;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: string | null;
  milestones?: CreateMilestoneDTO[];
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  category?: GoalCategory;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: string | null;
  status?: GoalStatus;
}

export interface ToggleMilestoneDTO {
  completed: boolean;
}

// ----------------------------------------------------
// LifeOS: Calendar Events
// ----------------------------------------------------
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  isAllDay: boolean;
  location?: string | null;
  recurrenceRule?: string | null;
  color?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isTaskDeadline?: boolean;
}

export interface CreateCalendarEventDTO {
  title: string;
  description?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  isAllDay?: boolean;
  location?: string;
  recurrenceRule?: string;
  color?: string;
}

export interface UpdateCalendarEventDTO {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  recurrenceRule?: string;
  color?: string;
}

// ----------------------------------------------------
// LifeOS: AI Assistant & Daily Review
// ----------------------------------------------------
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionExecuted?: {
    action: string;
    details: any;
  };
}

export interface AIChatRequestDTO {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  contextDate?: string;
}

export interface AIChatResponseDTO {
  reply: string;
  actionExecuted?: {
    action: string;
    details: any;
  } | null;
  suggestedPrompts?: string[];
}

export interface DailyReviewSummaryDTO {
  date: string;
  greeting: string;
  reflectionSummary: string;
  tasksCompleted: number;
  tasksPending: number;
  habitsCompleted: number;
  habitScorePercentage: number;
  moodScore: number | null;
  screenTimeTotalMinutes: number;
  suggestedFocusForTomorrow: string[];
}

