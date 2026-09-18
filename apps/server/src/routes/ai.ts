import { Router } from "express";
import type { CheckinInput, RecommendRequest, RecommendResponse, RoutinePlan, WeeklyInsightResponse } from "@app/shared-types";
import { prisma } from "../db/prisma";
import { runRecommendOrchestrator } from "../orchestrator/recommend";
import { runInsightAgent } from "../agents";
import { computeWeeklyMetrics } from "../insights/metrics";
import { toDailyCheckinRecord, toSleepLogRecord, toWeeklyInsightRecord } from "../db/mappers";

export const aiRouter = Router();

async function persistRoutine(plan: RoutinePlan, safetyStatus: string) {
  await prisma.routine.create({
    data: {
      id: plan.id,
      ownerType: "ai",
      title: plan.title,
      goal: plan.goal,
      durationMinutes: plan.durationMinutes,
      stepsJson: JSON.stringify(plan.steps),
      safetyStatus,
    },
  });
}

aiRouter.post("/api/ai/recommend", async (req, res) => {
  const body = req.body as RecommendRequest;
  if (!body?.userId || !body?.checkinId) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "userId and checkinId are required" });
  }

  const checkin = await prisma.dailyCheckin.findUnique({ where: { id: body.checkinId } });
  if (!checkin || checkin.userId !== body.userId) {
    return res.status(404).json({ code: "NOT_FOUND", message: "checkin not found" });
  }

  const input: CheckinInput = {
    mood: checkin.mood as CheckinInput["mood"],
    stressLevel: checkin.stressLevel,
    energyLevel: checkin.energyLevel,
    sleepiness: checkin.sleepiness,
    goal: checkin.goal as CheckinInput["goal"],
    availableMinutes: checkin.availableMinutes,
    note: checkin.note ?? undefined,
  };

  const result = await runRecommendOrchestrator(input);

  if (result.recommendation) {
    await Promise.all([
      persistRoutine(result.recommendation.primary, result.safety.status),
      ...result.recommendation.alternatives.map((alt) => persistRoutine(alt, result.safety.status)),
    ]);
  }

  const response: RecommendResponse = {
    state: result.state,
    recommendation: result.recommendation,
    safety: result.safety,
    agentTrace: result.agentTrace,
    crisisMessage: result.crisisMessage,
  };
  res.status(200).json(response);
});

aiRouter.post("/api/ai/insights/weekly", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ code: "BAD_REQUEST", message: "userId is required" });

  const metrics = await computeWeeklyMetrics(userId);
  const insightResponse = await runInsightAgent(metrics, 6000);
  const insight = insightResponse.result!;

  const row = await prisma.weeklyInsight.create({
    data: {
      userId,
      weekStart: insight.weekStart,
      metricsJson: JSON.stringify(insight.metrics),
      insightJson: JSON.stringify({ observations: insight.observations, uncertainties: insight.uncertainties, nextAction: insight.nextAction }),
    },
  });

  const [dailyCheckins, sleepLogs] = await Promise.all([
    prisma.dailyCheckin.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
    prisma.sleepLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
  ]);

  const response: WeeklyInsightResponse = {
    latest: toWeeklyInsightRecord(row),
    dailyCheckins: dailyCheckins.map(toDailyCheckinRecord),
    sleepLogs: sleepLogs.map(toSleepLogRecord),
  };
  res.status(200).json(response);
});
