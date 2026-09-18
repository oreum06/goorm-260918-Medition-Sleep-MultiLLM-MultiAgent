import type {
  CreateCheckinRequest,
  CreateCheckinResponse,
  CreateSleepLogRequest,
  CreateSleepLogResponse,
  RecommendRequest,
  RecommendResponse,
  StartSessionRequest,
  StartSessionResponse,
  CompleteSessionRequest,
  CompleteSessionResponse,
  WeeklyInsightResponse,
  RoutineRecord,
} from "@app/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export function createCheckin(body: CreateCheckinRequest) {
  return postJson<CreateCheckinResponse>("/api/checkins", body);
}

export function createSleepLog(body: CreateSleepLogRequest) {
  return postJson<CreateSleepLogResponse>("/api/sleep-logs", body);
}

export function recommend(body: RecommendRequest) {
  return postJson<RecommendResponse>("/api/ai/recommend", body);
}

export function startSession(body: StartSessionRequest) {
  return postJson<StartSessionResponse>("/api/sessions", body);
}

export function completeSession(sessionId: string, body: CompleteSessionRequest) {
  return postJson<CompleteSessionResponse>(`/api/sessions/${sessionId}/complete`, body);
}

export async function getRoutine(routineId: string): Promise<RoutineRecord> {
  const res = await fetch(`${API_BASE}/api/routines/${routineId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`getRoutine failed: ${res.status}`);
  const json = await res.json();
  return json.routine;
}

export async function getWeeklyInsight(userId: string): Promise<WeeklyInsightResponse> {
  const res = await fetch(`${API_BASE}/api/insights/weekly?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`getWeeklyInsight failed: ${res.status}`);
  return res.json();
}

export function generateWeeklyInsight(userId: string) {
  return postJson<WeeklyInsightResponse>("/api/ai/insights/weekly", { userId });
}

export function getOrCreateLocalUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  const key = "mindflow_user_id";
  let userId = window.localStorage.getItem(key);
  if (!userId) {
    userId = `user_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, userId);
  }
  return userId;
}
