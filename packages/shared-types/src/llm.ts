// 6장 공통 오류 코드 (스펙 원문 유니언 + 실무상 필요한 UNKNOWN 보강)
export type LLMErrorCode =
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_OUTPUT"
  | "SAFETY_BLOCK"
  | "UNKNOWN";

export const RETRYABLE_ERROR_CODES: Record<LLMErrorCode, boolean> = {
  AUTH_ERROR: false,
  RATE_LIMIT: true,
  TIMEOUT: true,
  PROVIDER_ERROR: true,
  INVALID_OUTPUT: true,
  SAFETY_BLOCK: false,
  UNKNOWN: false,
};

export interface LLMError {
  code: LLMErrorCode;
  message: string;
  retryable: boolean;
}

export interface ProviderHealth {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  timeoutMs: number;
}

export interface GenerateResult {
  raw: string; // JSON 문자열 원문 (파싱/검증은 호출자인 에이전트가 Zod로 수행)
  modelUsed: string;
  latencyMs: number;
}

// 6장 Provider 추상화. 모든 벤더 구현체(OpenAI/Claude/Gemini)는 이 인터페이스만 지키면 된다.
export interface LLMProvider {
  readonly name: string;
  generate(request: GenerateRequest): Promise<GenerateResult>;
  stream(request: GenerateRequest): AsyncIterable<string>;
  healthCheck(): Promise<ProviderHealth>;
}
