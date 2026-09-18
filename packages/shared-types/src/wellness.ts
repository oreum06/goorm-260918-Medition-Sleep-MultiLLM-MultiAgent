export const MOODS = ["anxious", "sad", "stressed", "tired", "neutral", "calm", "energetic"] as const;
export type Mood = (typeof MOODS)[number];

export const WELLNESS_GOALS = ["fall_asleep", "focus", "calm_down", "stress_relief", "general_relax"] as const;
export type WellnessGoal = (typeof WELLNESS_GOALS)[number];

export const AVAILABLE_MINUTES_OPTIONS = [3, 5, 10, 15] as const;

// F-02/F-03: 사용자가 슬라이더/선택형으로 직접 입력하는 원본 체크인 값
export interface CheckinInput {
  mood: Mood;
  stressLevel: number; // 1-5
  energyLevel: number; // 1-5
  sleepiness: number; // 1-5
  goal: WellnessGoal;
  availableMinutes: number;
  note?: string;
}

// Check-in Agent 출력: 구조화된 웰니스 상태 (8장 구조화 출력 예시의 state에 대응)
export interface WellnessState {
  mood: Mood;
  stressLevel: number;
  energyLevel: number;
  sleepiness: number;
  goal: WellnessGoal;
  availableMinutes: number;
  summary: string; // 사용자 상태에 대한 한 줄 공감 요약 (자유 입력이 있을 때만 LLM이 생성)
}
