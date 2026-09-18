import { v4 as uuid } from "uuid";
import type { AgentResponse, RoutinePlan, RoutineRecommendation, WellnessState } from "@app/shared-types";
import { AgentName, AgentResponseStatus, RoutineRecommendationDraftSchema, type RoutinePlanDraft } from "@app/shared-types";
import { getProviders, runWithFallback } from "../llm";
import { reviewRoutinePlan } from "./safetyAgent";
import { buildStaticRoutineRecommendation } from "./staticRoutines";

const SYSTEM_PROMPT = `너는 명상/수면 웰니스 앱의 루틴 설계자다. 의료 진단이나 치료가 아니라 일반적인 이완·수면 루틴을 만든다.
사용자의 현재 웰니스 상태(mood, stressLevel, energyLevel, sleepiness, goal, availableMinutes)를 받아
서로 뚜렷하게 다른 접근의 루틴 3개(primary 1개 + alternatives 2개)를 생성한다.

규칙:
- 매번 새롭고 구체적인 이미지·문장을 사용하고, 기존에 흔히 쓰이는 표현을 그대로 반복하지 않는다.
- 각 루틴의 steps.seconds 합은 availableMinutes * 60 (초)에 최대한 가깝게 맞춘다.
- step type은 breathing, body_scan, meditation, sleep_story, grounding, closing 중에서 상태에 맞게 조합한다.
- 의학적 진단, 처방, 완치, 효과 보장 표현을 절대 사용하지 않는다.
- reason 필드에는 왜 이 루틴이 지금 상태에 맞는지 한 문장으로 설명한다.
- 3개 루틴은 서로 다른 주제/구성이어야 한다 (예: 호흡 중심, 바디스캔 중심, 이야기 중심 등).
- 모든 문장은 반드시 한국어로 작성한다.

반드시 아래 JSON 스키마로만 응답한다:
{
  "primary": { "title": "string", "reason": "string", "steps": [{"type": "...", "seconds": number, "instruction": "string"}] },
  "alternatives": [ <같은 형태> , <같은 형태> ]
}`;

function normalizeDuration(draft: RoutinePlanDraft, availableMinutes: number): RoutinePlanDraft["steps"] {
  const targetSeconds = availableMinutes * 60;
  const currentTotal = draft.steps.reduce((sum, s) => sum + s.seconds, 0) || 1;
  const scale = targetSeconds / currentTotal;

  const scaled = draft.steps.map((s) => ({ ...s, seconds: Math.max(15, Math.round(s.seconds * scale)) }));
  const drift = targetSeconds - scaled.reduce((sum, s) => sum + s.seconds, 0);
  scaled[scaled.length - 1].seconds = Math.max(15, scaled[scaled.length - 1].seconds + drift);
  return scaled;
}

function toRoutinePlan(draft: RoutinePlanDraft, state: WellnessState): RoutinePlan {
  return {
    id: uuid(),
    title: draft.title,
    goal: state.goal,
    durationMinutes: state.availableMinutes,
    reason: draft.reason,
    steps: normalizeDuration(draft, state.availableMinutes),
  };
}

function hasMedicalClaim(recommendation: { primary: RoutinePlan; alternatives: RoutinePlan[] }): boolean {
  return [recommendation.primary, ...recommendation.alternatives].some(
    (plan) => reviewRoutinePlan(plan).reasons.includes("medical_claim_detected")
  );
}

export async function runRoutineAgent(
  state: WellnessState,
  deadlineMs: number
): Promise<AgentResponse<RoutineRecommendation>> {
  const start = Date.now();
  const { primary, fallback } = getProviders("routine");
  const userPrompt = JSON.stringify(state);

  const maxAttempts = 2; // 7장: 재시도는 Provider당 1회 + 환각(의료 주장) 발견 시 1회 재생성
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await runWithFallback(primary, fallback, {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      timeoutMs: deadlineMs,
      maxOutputTokens: 1200,
    });

    if (!result.ok || !result.result) {
      if (result.error && !result.error.retryable) break;
      continue;
    }

    const parsed = safeJsonParse(result.result.raw);
    const validated = parsed ? RoutineRecommendationDraftSchema.safeParse(parsed) : null;
    if (!validated?.success) continue;

    const recommendation: RoutineRecommendation = {
      primary: toRoutinePlan(validated.data.primary, state),
      alternatives: validated.data.alternatives.map((alt) => toRoutinePlan(alt, state)),
    };

    if (hasMedicalClaim(recommendation)) continue; // 재생성

    return {
      agent: AgentName.ROUTINE,
      status: AgentResponseStatus.SUCCESS,
      result: recommendation,
      modelUsed: result.result.modelUsed,
      latencyMs: Date.now() - start,
      error: null,
    };
  }

  // 모든 재시도 소진 -> 정적 루틴 골격으로 대체 (6.4 폴백 캐스케이드 최종 단계)
  return {
    agent: AgentName.ROUTINE,
    status: AgentResponseStatus.PARTIAL,
    result: buildStaticRoutineRecommendation(state.goal, state.availableMinutes),
    modelUsed: null,
    latencyMs: Date.now() - start,
    error: { code: "INVALID_OUTPUT", message: "fell back to static routine templates", retryable: false },
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
