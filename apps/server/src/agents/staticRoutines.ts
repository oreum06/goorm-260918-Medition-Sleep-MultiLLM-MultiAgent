import { v4 as uuid } from "uuid";
import type { RoutinePlan, RoutineRecommendation, RoutineStep, RoutineStepType, WellnessGoal } from "@app/shared-types";

interface StepTemplate {
  type: RoutineStepType;
  fraction: number; // 전체 시간에서 차지하는 비율
  instruction: string;
}

// 6.4 폴백 캐스케이드의 최종 단계: LLM이 모두 실패했을 때 쓰는 사전 검증된 정적 루틴 골격.
// fraction 비율로 저장해두고 availableMinutes에 맞춰 초 단위로 환산한다.
const TEMPLATES: Record<string, { title: string; reason: string; steps: StepTemplate[] }> = {
  breathing_first: {
    title: "천천히 가라앉히는 호흡",
    reason: "지금 상태에는 짧은 호흡 정돈이 먼저 도움이 될 수 있어요.",
    steps: [
      { type: "grounding", fraction: 0.1, instruction: "편안한 자세를 찾고, 발이 바닥에 닿는 느낌에 집중해보세요." },
      { type: "breathing", fraction: 0.6, instruction: "4초 들이쉬고 6초 내쉬는 호흡을 천천히 반복합니다." },
      { type: "closing", fraction: 0.3, instruction: "지금 이 순간의 편안함을 잠시 느껴보세요." },
    ],
  },
  body_scan_first: {
    title: "몸의 긴장을 내려놓는 시간",
    reason: "몸 곳곳의 긴장을 하나씩 풀어주는 것이 지금 상태에 잘 맞아요.",
    steps: [
      { type: "breathing", fraction: 0.2, instruction: "숨을 깊게 들이쉬고 천천히 내쉬며 시작합니다." },
      { type: "body_scan", fraction: 0.6, instruction: "발끝부터 머리끝까지 순서대로 힘을 빼며 이완합니다." },
      { type: "closing", fraction: 0.2, instruction: "이완된 몸의 느낌을 잠시 기억해보세요." },
    ],
  },
  sleep_story_first: {
    title: "고요한 이야기와 함께",
    reason: "생각을 잠시 다른 곳으로 옮기면 잠드는 데 도움이 될 수 있어요.",
    steps: [
      { type: "breathing", fraction: 0.15, instruction: "눈을 감고 편안하게 숨을 고릅니다." },
      { type: "sleep_story", fraction: 0.65, instruction: "천천히 밀려오는 파도 소리를 상상하며 마음을 편안히 둡니다." },
      { type: "closing", fraction: 0.2, instruction: "오늘의 걱정은 잠시 내려두어도 괜찮습니다." },
    ],
  },
};

function buildPlan(templateKey: keyof typeof TEMPLATES, goal: WellnessGoal, availableMinutes: number): RoutinePlan {
  const template = TEMPLATES[templateKey];
  const totalSeconds = availableMinutes * 60;
  const steps: RoutineStep[] = template.steps.map((s) => ({
    type: s.type,
    seconds: Math.max(15, Math.round(totalSeconds * s.fraction)),
    instruction: s.instruction,
  }));

  return {
    id: uuid(),
    title: template.title,
    goal,
    durationMinutes: availableMinutes,
    reason: template.reason,
    steps,
  };
}

export function buildStaticRoutineRecommendation(goal: WellnessGoal, availableMinutes: number): RoutineRecommendation {
  const order: (keyof typeof TEMPLATES)[] =
    goal === "fall_asleep"
      ? ["sleep_story_first", "body_scan_first", "breathing_first"]
      : ["breathing_first", "body_scan_first", "sleep_story_first"];

  const [primaryKey, alt1Key, alt2Key] = order;
  return {
    primary: buildPlan(primaryKey, goal, availableMinutes),
    alternatives: [buildPlan(alt1Key, goal, availableMinutes), buildPlan(alt2Key, goal, availableMinutes)],
  };
}
