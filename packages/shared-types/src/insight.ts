// 서버에서 계산한 7일 요약 통계 (14장: 원문 대신 요약 통계만 LLM에 전달)
export interface WeeklyMetrics {
  weekStart: string; // ISO date
  checkinCount: number;
  sessionCount: number;
  avgStressLevel: number | null;
  avgEnergyLevel: number | null;
  avgSleepQuality: number | null; // 1-5
  avgTensionDelta: number | null; // 세션 전후 긴장도 평균 변화 (음수면 완화)
}

// Insight Agent 출력 (시나리오 C: 관찰된 패턴 / 확실하지 않은 추정 / 다음 행동 1개를 구분)
export interface WeeklyInsight {
  weekStart: string;
  observations: string[];
  uncertainties: string[];
  nextAction: string;
  metrics: WeeklyMetrics;
}
