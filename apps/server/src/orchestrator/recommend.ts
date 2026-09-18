import type { AgentResponse, CheckinInput, RoutineRecommendation, SafetyReview, WellnessState } from "@app/shared-types";
import { AgentName, AgentResponseStatus } from "@app/shared-types";
import { runCheckinAgent, runRoutineAgent, detectCrisis, pickCrisisTemplate, reviewRoutineRecommendation } from "../agents";

const CHECKIN_DEADLINE_MS = 4000;
const ROUTINE_DEADLINE_MS = 8000;

export interface RecommendResult {
  state: WellnessState;
  recommendation: RoutineRecommendation | null;
  safety: SafetyReview;
  agentTrace: AgentResponse[];
  crisisMessage: string | null;
}

/**
 * 7장 오케스트레이션 흐름: Check-in Agent -> (위기 감지 시 즉시 차단) -> Routine Agent -> Safety Agent.
 * 최대 단계 수 4를 넘지 않는다 (여기서는 최대 3단계만 사용).
 */
export async function runRecommendOrchestrator(input: CheckinInput): Promise<RecommendResult> {
  const agentTrace: AgentResponse[] = [];

  const checkinResponse = await runCheckinAgent(input, CHECKIN_DEADLINE_MS);
  agentTrace.push(checkinResponse);
  const state = checkinResponse.result!;

  // 13장: 위기 신호가 감지되면 일반 루틴 생성 자체를 중단하고 고정 템플릿으로 즉시 안내한다.
  if (detectCrisis(input.note)) {
    const safety: SafetyReview = { status: "escalation", noticeRequired: true, reasons: ["crisis_keyword_detected"] };
    agentTrace.push({
      agent: AgentName.SAFETY,
      status: AgentResponseStatus.SUCCESS,
      result: safety,
      modelUsed: null,
      latencyMs: 0,
      error: null,
    });

    return {
      state,
      recommendation: null,
      safety,
      agentTrace,
      crisisMessage: pickCrisisTemplate(),
    };
  }

  const routineResponse = await runRoutineAgent(state, ROUTINE_DEADLINE_MS);
  agentTrace.push(routineResponse);
  const recommendation = routineResponse.result!;

  const safety = reviewRoutineRecommendation([recommendation.primary, ...recommendation.alternatives]);
  agentTrace.push({
    agent: AgentName.SAFETY,
    status: AgentResponseStatus.SUCCESS,
    result: safety,
    modelUsed: null,
    latencyMs: 0,
    error: null,
  });

  return { state, recommendation, safety, agentTrace, crisisMessage: null };
}
