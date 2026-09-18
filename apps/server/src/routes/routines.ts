import { Router } from "express";
import { prisma } from "../db/prisma";
import { toRoutineRecord } from "../db/mappers";

export const routinesRouter = Router();

routinesRouter.get("/api/routines/:id", async (req, res) => {
  const row = await prisma.routine.findUnique({ where: { id: req.params.id } });
  if (!row) return res.status(404).json({ code: "NOT_FOUND" });
  res.status(200).json({ routine: toRoutineRecord(row) });
});
