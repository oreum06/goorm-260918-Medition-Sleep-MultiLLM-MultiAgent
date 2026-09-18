import type { CheckinInput, WellnessState } from "./wellness";
import type { RoutineRecommendation } from "./routine";
import type { SafetyReview } from "./safety";
import type { WeeklyInsight } from "./insight";
import type {
  DailyCheckinRecord,
  SleepLogRecord,
  SessionLogRecord,
  SessionLogBeforeAfter,
  WeeklyInsightRecord,
} from "./db";
import type { AgentResponse } from "./agent";

// 11장 API 명세

export interface CreateCheckinRequest extends CheckinInput {
  userId: string;
}
export interface CreateCheckinResponse {
  checkin: DailyCheckinRecord;
}

export interface CreateSleepLogRequest {
  userId: string;
  sleepDate: string;
  bedAt: string;
  wakeAt: string;
  latencyMinutes: number;
  awakenings: number;
  quality: number;
}
export interface CreateSleepLogResponse {
  sleepLog: SleepLogRecord;
}

export interface RecommendRequest {
  userId: string;
  checkinId: string;
}
export interface RecommendResponse {
  state: WellnessState;
  recommendation: RoutineRecommendation | null;
  safety: SafetyReview;
  agentTrace: AgentResponse[];
  crisisMessage: string | null;
}

// 스펙의 POST /api/sessions/:id/start 를 세션 생성과 합쳐 하나의 호출로 단순화했다.
// (루틴은 추천 시점에만 정해지므로 클라이언트가 먼저 세션을 만들 근거가 없다)
export interface StartSessionRequest {
  userId: string;
  routineId: string;
  before: SessionLogBeforeAfter;
}
export interface StartSessionResponse {
  session: SessionLogRecord;
}

export interface CompleteSessionRequest {
  after: SessionLogBeforeAfter;
}
export interface CompleteSessionResponse {
  session: SessionLogRecord;
}

export interface WeeklyInsightResponse {
  latest: WeeklyInsightRecord | null;
  dailyCheckins: DailyCheckinRecord[];
  sleepLogs: SleepLogRecord[];
}

export interface ApiErrorBody {
  code: "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL_ERROR";
  message?: string;
}
