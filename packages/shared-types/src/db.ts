import type { Mood, WellnessGoal } from "./wellness";
import type { RoutineStep } from "./routine";
import type { SafetyStatus } from "./safety";
import type { WeeklyMetrics, WeeklyInsight } from "./insight";

// 10장 데이터 모델

export interface UserRecord {
  id: string;
  email: string;
  timezone: string;
  createdAt: string;
}

export interface UserPreferenceRecord {
  userId: string;
  goals: WellnessGoal[];
  defaultDurationMinutes: number;
  audioPreference: "sound" | "silent";
  reminderOptIn: boolean;
}

export interface DailyCheckinRecord {
  id: string;
  userId: string;
  mood: Mood;
  stressLevel: number;
  energyLevel: number;
  sleepiness: number;
  goal: WellnessGoal;
  availableMinutes: number;
  note: string | null;
  createdAt: string;
}

export interface SleepLogRecord {
  id: string;
  userId: string;
  sleepDate: string; // YYYY-MM-DD
  bedAt: string; // ISO datetime
  wakeAt: string; // ISO datetime
  latencyMinutes: number;
  awakenings: number;
  quality: number; // 1-5
  createdAt: string;
}

export interface RoutineRecord {
  id: string;
  ownerType: "system" | "ai";
  title: string;
  goal: WellnessGoal;
  durationMinutes: number;
  steps: RoutineStep[];
  safetyStatus: SafetyStatus;
  createdAt: string;
}

export interface SessionLogBeforeAfter {
  tension: number; // 1-5
  mood: Mood;
  sleepiness: number; // 1-5
}

export interface SessionLogRecord {
  id: string;
  userId: string;
  routineId: string;
  startedAt: string;
  completedAt: string | null;
  before: SessionLogBeforeAfter;
  after: SessionLogBeforeAfter | null;
}

export interface WeeklyInsightRecord {
  id: string;
  userId: string;
  weekStart: string;
  metrics: WeeklyMetrics;
  insight: WeeklyInsight;
  createdAt: string;
}
