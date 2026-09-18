import type { LLMErrorCode } from "./llm";

// 7장 에이전트 구성
export enum AgentName {
  ORCHESTRATOR = "ORCHESTRATOR",
  CHECKIN = "CHECKIN",
  ROUTINE = "ROUTINE",
  INSIGHT = "INSIGHT",
  SAFETY = "SAFETY",
}

export enum AgentResponseStatus {
  SUCCESS = "SUCCESS",
  PARTIAL = "PARTIAL", // 폴백 결과 (휴리스틱/정적 콘텐츠로 대체)
  FAILED = "FAILED",
}

export interface AgentError {
  code: LLMErrorCode;
  message: string;
  retryable: boolean;
}

// 모든 에이전트 호출의 트레이싱용 공통 응답 포맷 (관찰가능성 로그 = ai_runs 테이블과 대응)
export interface AgentResponse<T = unknown> {
  agent: AgentName;
  status: AgentResponseStatus;
  result: T | null;
  modelUsed: string | null;
  latencyMs: number;
  error: AgentError | null;
}
