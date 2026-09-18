import { OpenAiProvider } from "./openaiProvider";
import type { LLMProvider } from "@app/shared-types";

export type LlmTask = "checkin" | "routine" | "insight";

// 6장 라우팅 정책 표: 작업 유형별 1차/폴백 모델. 지금은 단일 벤더(OpenAI) 안에서만
// 모델 등급을 나누지만, Claude/Gemini 어댑터가 생기면 이 표만 바꾸면 된다.
const TASK_MODEL_ENV: Record<LlmTask, { primary: string; fallback: string }> = {
  checkin: { primary: "OPENAI_MODEL_FAST", fallback: "OPENAI_FALLBACK_MODEL" },
  routine: { primary: "OPENAI_MODEL_PRIMARY", fallback: "OPENAI_FALLBACK_MODEL" },
  insight: { primary: "OPENAI_MODEL_REASONING", fallback: "OPENAI_MODEL_PRIMARY" },
};

const DEFAULT_MODELS: Record<string, string> = {
  OPENAI_MODEL_FAST: "gpt-4o-mini",
  OPENAI_MODEL_PRIMARY: "gpt-4o-mini",
  OPENAI_MODEL_REASONING: "gpt-4o-mini",
  OPENAI_FALLBACK_MODEL: "gpt-3.5-turbo",
};

const providerCache = new Map<string, LLMProvider>();

function getProvider(modelEnvKey: string): LLMProvider {
  const modelName = process.env[modelEnvKey] || DEFAULT_MODELS[modelEnvKey];
  if (!providerCache.has(modelName)) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    providerCache.set(modelName, new OpenAiProvider(apiKey, modelName));
  }
  return providerCache.get(modelName)!;
}

export function getProviders(task: LlmTask): { primary: LLMProvider; fallback: LLMProvider | null } {
  const envKeys = TASK_MODEL_ENV[task];
  const primary = getProvider(envKeys.primary);
  const fallbackModelName = process.env[envKeys.fallback] || DEFAULT_MODELS[envKeys.fallback];
  const primaryModelName = process.env[envKeys.primary] || DEFAULT_MODELS[envKeys.primary];
  const fallback = fallbackModelName === primaryModelName ? null : getProvider(envKeys.fallback);
  return { primary, fallback };
}

export { runWithFallback } from "./router";
