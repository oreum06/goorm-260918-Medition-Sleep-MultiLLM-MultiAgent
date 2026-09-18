import { Router } from "express";
import type { CreateSleepLogRequest, CreateSleepLogResponse } from "@app/shared-types";
import { prisma } from "../db/prisma";
import { ensureUser } from "../db/users";
import { toSleepLogRecord } from "../db/mappers";

export const sleepLogsRouter = Router();

sleepLogsRouter.post("/api/sleep-logs", async (req, res) => {
  const body = req.body as CreateSleepLogRequest;
  if (!body?.userId || !body?.sleepDate || !body?.bedAt || !body?.wakeAt) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "userId, sleepDate, bedAt, wakeAt are required" });
  }

  await ensureUser(body.userId);

  const row = await prisma.sleepLog.create({
    data: {
      userId: body.userId,
      sleepDate: body.sleepDate,
      bedAt: new Date(body.bedAt),
      wakeAt: new Date(body.wakeAt),
      latencyMinutes: body.latencyMinutes,
      awakenings: body.awakenings,
      quality: body.quality,
    },
  });

  const response: CreateSleepLogResponse = { sleepLog: toSleepLogRecord(row) };
  res.status(200).json(response);
});
