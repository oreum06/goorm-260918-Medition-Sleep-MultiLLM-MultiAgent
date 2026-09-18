import { Router } from "express";
import type { CompleteSessionRequest, CompleteSessionResponse, StartSessionRequest, StartSessionResponse } from "@app/shared-types";
import { prisma } from "../db/prisma";
import { ensureUser } from "../db/users";
import { toSessionLogRecord } from "../db/mappers";

export const sessionsRouter = Router();

// 스펙의 POST /api/sessions/:id/start 를 세션 생성과 합쳐 하나로 단순화 (api.ts 주석 참고)
sessionsRouter.post("/api/sessions", async (req, res) => {
  const body = req.body as StartSessionRequest;
  if (!body?.userId || !body?.routineId || !body?.before) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "userId, routineId, before are required" });
  }

  await ensureUser(body.userId);

  const routine = await prisma.routine.findUnique({ where: { id: body.routineId } });
  if (!routine) return res.status(404).json({ code: "NOT_FOUND", message: "routine not found" });

  const row = await prisma.sessionLog.create({
    data: {
      userId: body.userId,
      routineId: body.routineId,
      beforeJson: JSON.stringify(body.before),
    },
  });

  const response: StartSessionResponse = { session: toSessionLogRecord(row) };
  res.status(200).json(response);
});

sessionsRouter.post("/api/sessions/:id/complete", async (req, res) => {
  const body = req.body as CompleteSessionRequest;
  if (!body?.after) return res.status(400).json({ code: "BAD_REQUEST", message: "after is required" });

  const existing = await prisma.sessionLog.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ code: "NOT_FOUND" });

  const row = await prisma.sessionLog.update({
    where: { id: req.params.id },
    data: { completedAt: new Date(), afterJson: JSON.stringify(body.after) },
  });

  const response: CompleteSessionResponse = { session: toSessionLogRecord(row) };
  res.status(200).json(response);
});
