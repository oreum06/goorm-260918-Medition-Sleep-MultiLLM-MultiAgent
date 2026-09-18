import type { WeeklyMetrics } from "@app/shared-types";
import { prisma } from "../db/prisma";

// 14장: 원문 기록을 매번 전송하지 않고, 서버에서 계산한 7일 요약 통계만 InsightAgent에 전달한다.
export async function computeWeeklyMetrics(userId: string): Promise<WeeklyMetrics> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [checkins, sessions, sleepLogs] = await Promise.all([
    prisma.dailyCheckin.findMany({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.sessionLog.findMany({ where: { userId, startedAt: { gte: weekAgo }, completedAt: { not: null } } }),
    prisma.sleepLog.findMany({ where: { userId, createdAt: { gte: weekAgo } } }),
  ]);

  const avg = (values: number[]): number | null =>
    values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length;

  const tensionDeltas = sessions
    .map((s) => {
      try {
        const before = JSON.parse(s.beforeJson) as { tension: number };
        const after = s.afterJson ? (JSON.parse(s.afterJson) as { tension: number }) : null;
        return after ? after.tension - before.tension : null;
      } catch {
        return null;
      }
    })
    .filter((v): v is number => v !== null);

  return {
    weekStart: weekAgo.toISOString().slice(0, 10),
    checkinCount: checkins.length,
    sessionCount: sessions.length,
    avgStressLevel: avg(checkins.map((c) => c.stressLevel)),
    avgEnergyLevel: avg(checkins.map((c) => c.energyLevel)),
    avgSleepQuality: avg(sleepLogs.map((s) => s.quality)),
    avgTensionDelta: avg(tensionDeltas),
  };
}
