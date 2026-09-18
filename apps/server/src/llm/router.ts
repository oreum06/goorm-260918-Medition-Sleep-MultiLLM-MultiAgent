import type { LLMProvider, GenerateRequest, GenerateResult, LLMError } from "@app/shared-types";
import { RETRYABLE_ERROR_CODES, type LLMErrorCode } from "@app/shared-types";

function classifyError(err: unknown): LLMErrorCode {
  const anyErr = err as { name?: string; status?: number; code?: string };
  if (anyErr?.name === "AbortError") return "TIMEOUT";
  if (anyErr?.status === 401 || anyErr?.status === 403) return "AUTH_ERROR";
  if (anyErr?.status === 429) return "RATE_LIMIT";
  if (anyErr?.status && anyErr.status >= 500) return "PROVIDER_ERROR";
  if (anyErr?.code === "content_filter") return "SAFETY_BLOCK";
  return "UNKNOWN";
}

function toLLMError(code: LLMErrorCode, message: string): LLMError {
  return { code, message, retryable: RETRYABLE_ERROR_CODES[code] };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RouterResult {
  ok: boolean;
  result: GenerateResult | null;
  error: LLMError | null;
}

/**
 * 6장 라우팅 정책 + 7장 "재시도는 Provider당 1회로 제한":
 * 1차 Provider -> (재시도 가능한 에러일 때만) 같은 Provider 지터 재시도 1회 -> 폴백 Provider 1회.
 */
export async function runWithFallback(
  primary: LLMProvider,
  fallback: LLMProvider | null,
  request: GenerateRequest
): Promise<RouterResult> {
  let lastError: LLMError = toLLMError("UNKNOWN", "no attempt made");

  try {
    const result = await primary.generate(request);
    return { ok: true, result, error: null };
  } catch (err) {
    const code = classifyError(err);
    lastError = toLLMError(code, err instanceof Error ? err.message : String(err));

    if (RETRYABLE_ERROR_CODES[code]) {
      await sleep(200 + Math.random() * 300);
      try {
        const result = await primary.generate(request);
        return { ok: true, result, error: null };
      } catch (retryErr) {
        lastError = toLLMError(classifyError(retryErr), retryErr instanceof Error ? retryErr.message : String(retryErr));
      }
    }
  }

  if (fallback) {
    try {
      const result = await fallback.generate(request);
      return { ok: true, result, error: null };
    } catch (fallbackErr) {
      lastError = toLLMError(classifyError(fallbackErr), fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
    }
  }

  return { ok: false, result: null, error: lastError };
}
