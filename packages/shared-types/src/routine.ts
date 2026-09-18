import type { WellnessGoal } from "./wellness";

export const ROUTINE_STEP_TYPES = [
  "breathing",
  "body_scan",
  "meditation",
  "sleep_story",
  "grounding",
  "closing",
] as const;
export type RoutineStepType = (typeof ROUTINE_STEP_TYPES)[number];

export interface RoutineStep {
  type: RoutineStepType;
  seconds: number;
  instruction: string;
}

// Routine Agent 출력 단위 (8장 routine에 대응). F-04: 대표 1개 + 대안 2개로 3개가 항상 함께 생성된다.
export interface RoutinePlan {
  id: string;
  title: string;
  goal: WellnessGoal;
  durationMinutes: number;
  reason: string; // 이 루틴을 추천하는 이유 (개인화 근거)
  steps: RoutineStep[];
}

export interface RoutineRecommendation {
  primary: RoutinePlan;
  alternatives: RoutinePlan[]; // length 2
}
