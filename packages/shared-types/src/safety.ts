export const SAFETY_STATUSES = ["safe", "caution", "escalation"] as const;
export type SafetyStatus = (typeof SAFETY_STATUSES)[number];

// Safety Agent 출력 (8장 safety에 대응, 13장 위기개입 정책과 연동)
export interface SafetyReview {
  status: SafetyStatus;
  noticeRequired: boolean;
  reasons: string[];
}
