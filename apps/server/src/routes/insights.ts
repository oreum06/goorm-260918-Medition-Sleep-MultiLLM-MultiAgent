import { Router } from "express";
import type { WeeklyInsightResponse } from "@app/shared-types";
import { prisma } from "../db/prisma";
import { toDailyCheckinRecord, toSleepLogRecord, toWeeklyInsightRecord } from "../db/mappers";

export const insightsRouter = Router();

insightsRouter.get("/api/insights/weekly", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) return res.status(400).json({ code: "BAD_REQUEST", message: "userId query param is required" });

  const [latestRow, dailyCheckins, sleepLogs] = await Promise.all([
    prisma.weeklyInsight.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.dailyCheckin.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
    prisma.sleepLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
  ]);

  const response: WeeklyInsightResponse = {
    latest: latestRow ? toWeeklyInsightRecord(latestRow) : null,
    dailyCheckins: dailyCheckins.map(toDailyCheckinRecord),
    sleepLogs: sleepLogs.map(toSleepLogRecord),
  };
  res.status(200).json(response);
});
