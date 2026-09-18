import type { AgentResponse, WeeklyInsight, WeeklyMetrics } from "@app/shared-types";
import { AgentName, AgentResponseStatus, WeeklyInsightDraftSchema } from "@app/shared-types";
import { getProviders, runWithFallback } from "../llm";

const SYSTEM_PROMPT = `너는 명상/수면 웰니스 앱의 주간 회고 코치다. 사용자의 지난 7일 요약 통계(원문 기록이 아닌 집계 수치)만 받는다.
observations는 데이터에서 실제로 관찰되는 패턴만 적고, uncertainties는 데이터만으로는 확신할 수 없는 추정을 구분해서 적는다.
nextAction은 다음 주에 시도해볼 수 있는 아주 작은 실험 1개만 제안한다. 진단이나 치료를 암시하는 표현은 쓰지 않는다.
모든 문장은 반드시 한국어로 작성한다.
반드시 아래 JSON 스키마로만 응답한다:
{ "observations": ["string", ...], "uncertainties": ["string", ...], "nextAction": "string" }`;

function buildFallbackInsight(metrics: WeeklyMetrics): { observations: string[]; uncertainties: string[]; nextAction: string } {
  const observations: string[] = [];
  if (metrics.checkinCount > 0) {
    observations.push(`지난 7일간 ${metrics.checkinCount}회 체크인을 남기셨어요.`);
  }
  if (metrics.sessionCount > 0) {
    observations.push(`${metrics.sessionCount}회의 루틴 세션을 완료하셨어요.`);
  }
  if (metrics.avgTensionDelta !== null && metrics.avgTensionDelta < 0) {
    observations.push("세션 후 긴장도가 평균적으로 낮아지는 경향이 있었어요.");
  }
  if (observations.length === 0) {
    observations.push("아직 기록이 충분하지 않아 뚜렷한 패턴을 보기 어려워요.");
  }

  return {
    observations,
    uncertainties: ["기록 횟수가 적을 경우 이 관찰은 우연일 수 있어요."],
    nextAction: "이번 주에는 잠들기 전 짧은 체크인을 하루도 빼먹지 않고 남겨보세요.",
  };
}

export async function runInsightAgent(
  metrics: WeeklyMetrics,
  deadlineMs: number
): Promise<AgentResponse<WeeklyInsight>> {
  const start = Date.now();

  if (metrics.checkinCount === 0 && metrics.sessionCount === 0) {
    return {
      agent: AgentName.INSIGHT,
      status: AgentResponseStatus.SUCCESS,
      result: { weekStart: metrics.weekStart, metrics, ...buildFallbackInsight(metrics) },
      modelUsed: null,
      latencyMs: Date.now() - start,
      error: null,
    };
  }

  const { primary, fallback } = getProviders("insight");
  const result = await runWithFallback(primary, fallback, {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: JSON.stringify(metrics),
    timeoutMs: deadlineMs,
    maxOutputTokens: 500,
  });

  if (result.ok && result.result) {
    const parsed = safeJsonParse(result.result.raw);
    const validated = parsed ? WeeklyInsightDraftSchema.safeParse(parsed) : null;
    if (validated?.success) {
      return {
        agent: AgentName.INSIGHT,
        status: AgentResponseStatus.SUCCESS,
        result: { weekStart: metrics.weekStart, metrics, ...validated.data },
        modelUsed: result.result.modelUsed,
        latencyMs: Date.now() - start,
        error: null,
      };
    }
  }

  return {
    agent: AgentName.INSIGHT,
    status: AgentResponseStatus.PARTIAL,
    result: { weekStart: metrics.weekStart, metrics, ...buildFallbackInsight(metrics) },
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
