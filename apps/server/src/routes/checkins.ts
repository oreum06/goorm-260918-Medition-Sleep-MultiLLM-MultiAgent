import { Router } from "express";
import type { CreateCheckinRequest, CreateCheckinResponse } from "@app/shared-types";
import { prisma } from "../db/prisma";
import { ensureUser } from "../db/users";
import { toDailyCheckinRecord } from "../db/mappers";

export const checkinsRouter = Router();

checkinsRouter.post("/api/checkins", async (req, res) => {
  const body = req.body as CreateCheckinRequest;
  if (!body?.userId || !body?.mood || !body?.goal || !body?.availableMinutes) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "userId, mood, goal, availableMinutes are required" });
  }

  await ensureUser(body.userId);

  const row = await prisma.dailyCheckin.create({
    data: {
      userId: body.userId,
      mood: body.mood,
      stressLevel: body.stressLevel,
      energyLevel: body.energyLevel,
      sleepiness: body.sleepiness,
      goal: body.goal,
      availableMinutes: body.availableMinutes,
      note: body.note ?? null,
    },
  });

  const response: CreateCheckinResponse = { checkin: toDailyCheckinRecord(row) };
  res.status(200).json(response);
});
