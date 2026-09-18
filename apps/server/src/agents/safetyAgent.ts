import type { RoutinePlan, SafetyReview } from "@app/shared-types";

// 13장: 위기 대응 문구는 LLM 자유 생성이 아니라 검토된 고정 템플릿을 사용한다.
const CRISIS_KEYWORDS = [
  "죽고 싶", "자살", "자해", "사라지고 싶", "끝내고 싶",
  "숨을 못 쉬", "흉통", "가슴 통증", "약을 끊",
  "kill myself", "suicide", "self harm", "want to die", "end it all",
  "chest pain", "can't breathe", "stop taking my medication",
];

export const CRISIS_TEMPLATES: string[] = [
  "지금 많이 힘드신 것 같아요. 이 앱은 의료 서비스가 아니라 일반적인 웰니스 도구이기 때문에, 지금 상황에는 전문가의 도움이 더 안전해요. " +
    "위급하다고 느껴지면 국내 자살예방상담전화 1393, 정신건강 위기상담전화 1577-0199, 또는 응급 상황이면 112/119로 즉시 연락해 주세요. " +
    "곁에 있는 신뢰할 수 있는 사람에게 지금 이 마음을 알리는 것도 큰 도움이 됩니다.",
  "몸이나 마음에 위험 신호가 느껴진다고 하셨어요. 이 앱의 루틴으로는 지금 상황을 다룰 수 없어요. " +
    "흉통이나 심각한 호흡곤란이 있다면 즉시 119에 연락하시고, 마음이 힘드시다면 1393(자살예방상담전화)으로 연락해 주세요. " +
    "혼자 견디지 않으셔도 괜찮습니다.",
];

export function detectCrisis(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

export function pickCrisisTemplate(): string {
  return CRISIS_TEMPLATES[Math.floor(Math.random() * CRISIS_TEMPLATES.length)];
}

const MEDICAL_CLAIM_PATTERN = /진단|처방|치료제|복용량|완치|치료 효과가 보장/;

// 8장 safety, 13장 정책: LLM이 생성한 루틴 텍스트에 대한 규칙 기반 2차 검증.
export function reviewRoutinePlan(plan: { title: string; reason: string; steps: { instruction: string }[] }): SafetyReview {
  const reasons: string[] = [];
  const allText = [plan.title, plan.reason, ...plan.steps.map((s) => s.instruction)].join(" ");

  if (MEDICAL_CLAIM_PATTERN.test(allText)) {
    reasons.push("medical_claim_detected");
  }
  if (!plan.steps.length) {
    reasons.push("empty_routine");
  }

  const hasBreathing = plan.steps.some((s) => "type" in s && (s as { type?: string }).type === "breathing");

  return {
    status: reasons.length > 0 ? "caution" : "safe",
    noticeRequired: hasBreathing || reasons.length > 0,
    reasons,
  };
}

export const BREATHING_SAFETY_NOTICE =
  "호흡 연습 중 어지러움이나 불편함이 느껴지면 즉시 멈추고 평소 호흡으로 돌아오세요.";

export function reviewRoutineRecommendation(plans: RoutinePlan[]): SafetyReview {
  const reviews = plans.map(reviewRoutinePlan);
  const allReasons = Array.from(new Set(reviews.flatMap((r) => r.reasons)));
  const worstStatus = reviews.some((r) => r.status === "caution") ? "caution" : "safe";
  return {
    status: worstStatus,
    noticeRequired: reviews.some((r) => r.noticeRequired),
    reasons: allReasons,
  };
}
