import type {
  DailyCheckinRecord,
  SleepLogRecord,
  RoutineRecord,
  SessionLogRecord,
  WeeklyInsightRecord,
} from "@app/shared-types";

type DailyCheckinRow = {
  id: string; userId: string; mood: string; stressLevel: number; energyLevel: number;
  sleepiness: number; goal: string; availableMinutes: number; note: string | null; createdAt: Date;
};

export function toDailyCheckinRecord(row: DailyCheckinRow): DailyCheckinRecord {
  return {
    id: row.id,
    userId: row.userId,
    mood: row.mood as DailyCheckinRecord["mood"],
    stressLevel: row.stressLevel,
    energyLevel: row.energyLevel,
    sleepiness: row.sleepiness,
    goal: row.goal as DailyCheckinRecord["goal"],
    availableMinutes: row.availableMinutes,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

type SleepLogRow = {
  id: string; userId: string; sleepDate: string; bedAt: Date; wakeAt: Date;
  latencyMinutes: number; awakenings: number; quality: number; createdAt: Date;
};

export function toSleepLogRecord(row: SleepLogRow): SleepLogRecord {
  return {
    id: row.id,
    userId: row.userId,
    sleepDate: row.sleepDate,
    bedAt: row.bedAt.toISOString(),
    wakeAt: row.wakeAt.toISOString(),
    latencyMinutes: row.latencyMinutes,
    awakenings: row.awakenings,
    quality: row.quality,
    createdAt: row.createdAt.toISOString(),
  };
}

type RoutineRow = {
  id: string; ownerType: string; title: string; goal: string;
  durationMinutes: number; stepsJson: string; safetyStatus: string; createdAt: Date;
};

export function toRoutineRecord(row: RoutineRow): RoutineRecord {
  return {
    id: row.id,
    ownerType: row.ownerType as RoutineRecord["ownerType"],
    title: row.title,
    goal: row.goal as RoutineRecord["goal"],
    durationMinutes: row.durationMinutes,
    steps: JSON.parse(row.stepsJson),
    safetyStatus: row.safetyStatus as RoutineRecord["safetyStatus"],
    createdAt: row.createdAt.toISOString(),
  };
}

type SessionLogRow = {
  id: string; userId: string; routineId: string; startedAt: Date; completedAt: Date | null;
  beforeJson: string; afterJson: string | null;
};

export function toSessionLogRecord(row: SessionLogRow): SessionLogRecord {
  return {
    id: row.id,
    userId: row.userId,
    routineId: row.routineId,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    before: JSON.parse(row.beforeJson),
    after: row.afterJson ? JSON.parse(row.afterJson) : null,
  };
}

type WeeklyInsightRow = {
  id: string; userId: string; weekStart: string; metricsJson: string; insightJson: string; createdAt: Date;
};

export function toWeeklyInsightRecord(row: WeeklyInsightRow): WeeklyInsightRecord {
  const insightBody = JSON.parse(row.insightJson);
  const metrics = JSON.parse(row.metricsJson);
  return {
    id: row.id,
    userId: row.userId,
    weekStart: row.weekStart,
    metrics,
    insight: { weekStart: row.weekStart, metrics, ...insightBody },
    createdAt: row.createdAt.toISOString(),
  };
}
