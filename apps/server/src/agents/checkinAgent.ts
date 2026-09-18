import type { AgentResponse, CheckinInput, WellnessState } from "@app/shared-types";
import { AgentName, AgentResponseStatus, CheckinRefinementSchema } from "@app/shared-types";
import { getProviders, runWithFallback } from "../llm";

const SYSTEM_PROMPT = `너는 명상/수면 웰니스 앱의 체크인 해석기다.
사용자가 슬라이더로 이미 입력한 mood/stressLevel/energyLevel/sleepiness/goal 값과, 자유롭게 적은 메모를 함께 받는다.
메모가 슬라이더 값과 다른 감정을 강하게 암시하면 moodOverride에 더 적절한 값을 넣고, 아니면 null로 둔다.
summary는 사용자의 상태를 1문장으로 따뜻하게 공감하며 반영한 문장이다 (진단하지 말고, 의학적 표현 금지).
summary는 반드시 한국어로 작성한다.
반드시 아래 JSON 스키마로만 응답한다:
{ "summary": "string", "moodOverride": "anxious"|"sad"|"stressed"|"tired"|"neutral"|"calm"|"energetic"|null }`;

const MOOD_SUMMARY_TEMPLATES: Record<string, string> = {
  anxious: "지금 마음이 조금 불안하신 것 같아요.",
  sad: "마음이 가라앉아 있으신 것 같네요.",
  stressed: "스트레스가 많이 쌓이신 것 같아요.",
  tired: "많이 지쳐 있으신 것 같아요.",
  calm: "차분한 상태시네요.",
  energetic: "활력이 느껴지는 상태네요.",
  neutral: "오늘의 상태를 잘 들려주셨어요.",
};

export async function runCheckinAgent(
  input: CheckinInput,
  deadlineMs: number
): Promise<AgentResponse<WellnessState>> {
  const start = Date.now();
  const baseState: WellnessState = {
    mood: input.mood,
    stressLevel: input.stressLevel,
    energyLevel: input.energyLevel,
    sleepiness: input.sleepiness,
    goal: input.goal,
    availableMinutes: input.availableMinutes,
    summary: MOOD_SUMMARY_TEMPLATES[input.mood] ?? MOOD_SUMMARY_TEMPLATES.neutral,
  };

  // 6장 라우팅 정책: 체크인 구조화는 자유 입력이 있을 때만 (빠르고 저렴한 모델을) 호출한다.
  if (!input.note || !input.note.trim()) {
    return {
      agent: AgentName.CHECKIN,
      status: AgentResponseStatus.SUCCESS,
      result: baseState,
      modelUsed: null,
      latencyMs: Date.now() - start,
      error: null,
    };
  }

  const { primary, fallback } = getProviders("checkin");
  const userPrompt = JSON.stringify({
    mood: input.mood,
    stressLevel: input.stressLevel,
    energyLevel: input.energyLevel,
    sleepiness: input.sleepiness,
    goal: input.goal,
    availableMinutes: input.availableMinutes,
    note: input.note,
  });

  const result = await runWithFallback(primary, fallback, {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    timeoutMs: deadlineMs,
    maxOutputTokens: 150,
  });

  if (result.ok && result.result) {
    const parsedJson = safeJsonParse(result.result.raw);
    const validated = parsedJson ? CheckinRefinementSchema.safeParse(parsedJson) : null;
    if (validated?.success) {
      return {
        agent: AgentName.CHECKIN,
        status: AgentResponseStatus.SUCCESS,
        result: {
          ...baseState,
          mood: validated.data.moodOverride ?? baseState.mood,
          summary: validated.data.summary,
        },
        modelUsed: result.result.modelUsed,
        latencyMs: Date.now() - start,
        error: null,
      };
    }
  }

  // LLM 실패/스키마 위반 -> 슬라이더 기반 기본 요약으로 대체 (PARTIAL)
  return {
    agent: AgentName.CHECKIN,
    status: AgentResponseStatus.PARTIAL,
    result: baseState,
    modelUsed: null,
    latencyMs: Date.now() - start,
    error: result.error ?? { code: "INVALID_OUTPUT", message: "schema validation failed", retryable: true },
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
