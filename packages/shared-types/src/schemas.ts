import { z } from "zod";
import { MOODS } from "./wellness";
import { ROUTINE_STEP_TYPES } from "./routine";
import { SAFETY_STATUSES } from "./safety";

// 7장 "모든 중간 결과는 JSON Schema로 검증한다"를 Zod로 구현.
// LLM 원문 출력에 대해서만 검증하고, id/createdAt 등 서버가 채우는 필드는 스키마에서 제외한다.

export const CheckinRefinementSchema = z.object({
  summary: z.string().min(1).max(200),
  moodOverride: z.enum(MOODS).nullable().optional(),
});
export type CheckinRefinement = z.infer<typeof CheckinRefinementSchema>;

export const RoutineStepDraftSchema = z.object({
  type: z.enum(ROUTINE_STEP_TYPES),
  seconds: z.number().int().positive().max(1800),
  instruction: z.string().min(1).max(400),
});

export const RoutinePlanDraftSchema = z.object({
  title: z.string().min(1).max(80),
  reason: z.string().min(1).max(300),
  steps: z.array(RoutineStepDraftSchema).min(1).max(6),
});
export type RoutinePlanDraft = z.infer<typeof RoutinePlanDraftSchema>;

export const RoutineRecommendationDraftSchema = z.object({
  primary: RoutinePlanDraftSchema,
  alternatives: z.array(RoutinePlanDraftSchema).length(2),
});
export type RoutineRecommendationDraft = z.infer<typeof RoutineRecommendationDraftSchema>;

export const SafetyReviewSchema = z.object({
  status: z.enum(SAFETY_STATUSES),
  noticeRequired: z.boolean(),
  reasons: z.array(z.string()),
});

export const WeeklyInsightDraftSchema = z.object({
  observations: z.array(z.string().min(1)).min(1).max(5),
  uncertainties: z.array(z.string().min(1)).max(5),
  nextAction: z.string().min(1).max(300),
});
export type WeeklyInsightDraft = z.infer<typeof WeeklyInsightDraftSchema>;
