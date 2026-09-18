import { Router } from "express";
import { prisma } from "../db/prisma";

export const meRouter = Router();

// 13장: 개인정보 최소화 원칙에 따른 사용자 데이터 삭제권
meRouter.delete("/api/me/data", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) return res.status(400).json({ code: "BAD_REQUEST", message: "userId query param is required" });

  await prisma.$transaction([
    prisma.sessionLog.deleteMany({ where: { userId } }),
    prisma.weeklyInsight.deleteMany({ where: { userId } }),
    prisma.dailyCheckin.deleteMany({ where: { userId } }),
    prisma.sleepLog.deleteMany({ where: { userId } }),
    prisma.userPreference.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ]);

  res.status(200).json({ ok: true });
});
