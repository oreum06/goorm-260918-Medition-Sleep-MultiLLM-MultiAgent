"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Mood, WellnessGoal, RecommendResponse } from "@app/shared-types";
import { PageShell } from "../../components/PageShell";
import { ChipSelect } from "../../components/ChipSelect";
import { LevelSlider } from "../../components/LevelSlider";
import { RoutineCard } from "../../components/RoutineCard";
import { CrisisNotice } from "../../components/CrisisNotice";
import { createCheckin, recommend, getOrCreateLocalUserId } from "../../lib/api";

const MOOD_OPTIONS: { value: Mood; text: string; emoji: string }[] = [
  { value: "anxious", text: "불안해요", emoji: "😰" },
  { value: "sad", text: "가라앉아요", emoji: "😔" },
  { value: "stressed", text: "스트레스", emoji: "😖" },
  { value: "tired", text: "지쳤어요", emoji: "🥱" },
  { value: "neutral", text: "보통이에요", emoji: "😐" },
  { value: "calm", text: "차분해요", emoji: "🙂" },
  { value: "energetic", text: "활기차요", emoji: "⚡" },
];

const GOAL_OPTIONS: { value: WellnessGoal; text: string }[] = [
  { value: "fall_asleep", text: "잠들기" },
  { value: "focus", text: "집중하기" },
  { value: "calm_down", text: "진정하기" },
  { value: "stress_relief", text: "스트레스 해소" },
  { value: "general_relax", text: "그냥 이완하기" },
];

const MINUTE_OPTIONS = [3, 5, 10, 15];

export default function CheckinPage() {
  const router = useRouter();
  const [mood, setMood] = useState<Mood>("neutral");
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepiness, setSleepiness] = useState(3);
  const [goal, setGoal] = useState<WellnessGoal>("calm_down");
  const [availableMinutes, setAvailableMinutes] = useState(5);
  const [note, setNote] = useState("");

  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setStep("loading");
    setError(null);
    try {
      const userId = getOrCreateLocalUserId();
      const { checkin } = await createCheckin({
        userId,
        mood,
        stressLevel,
        energyLevel,
        sleepiness,
        goal,
        availableMinutes,
        note: note.trim() || undefined,
      });
      const rec = await recommend({ userId, checkinId: checkin.id });
      setResult(rec);
      setStep("result");
    } catch (err) {
      console.error(err);
      setError("잠시 문제가 생겼어요. 다시 시도해 주세요.");
      setStep("form");
    }
  }

  if (step === "loading") {
    return (
      <PageShell title="체크인">
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-calm-200">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-calm-400 border-t-transparent" />
          <p className="text-sm">지금 상태에 맞는 루틴을 준비하고 있어요...</p>
        </div>
      </PageShell>
    );
  }

  if (step === "result" && result) {
    return (
      <PageShell title="맞춤 루틴 추천">
        <div className="space-y-4">
          <p className="text-sm text-calm-100">{result.state.summary}</p>

          {result.crisisMessage ? (
            <CrisisNotice message={result.crisisMessage} />
          ) : result.recommendation ? (
            <>
              {result.safety.noticeRequired && (
                <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-calm-300">
                  호흡 연습 중 어지러움이나 불편함이 느껴지면 즉시 멈추고 평소 호흡으로 돌아오세요.
                </p>
              )}
              <RoutineCard
                plan={result.recommendation.primary}
                highlighted
                onSelect={() => router.push(`/player/${result.recommendation!.primary.id}`)}
              />
              <p className="pt-2 text-xs uppercase tracking-wide text-calm-400">다른 루틴도 볼까요?</p>
              {result.recommendation.alternatives.map((alt) => (
                <RoutineCard key={alt.id} plan={alt} onSelect={() => router.push(`/player/${alt.id}`)} />
              ))}
            </>
          ) : (
            <p className="text-sm text-calm-200">추천을 만들지 못했어요. 다시 시도해 주세요.</p>
          )}

          <button
            onClick={() => setStep("form")}
            className="min-h-[44px] w-full rounded-full border border-white/15 text-sm text-calm-200"
          >
            체크인 다시 하기
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="오늘의 체크인" subtitle="지금 상태를 알려주시면 맞춤 루틴을 만들어드려요.">
      <div className="space-y-6">
        <ChipSelect label="지금 기분은 어떠세요?" options={MOOD_OPTIONS} value={mood} onChange={setMood} />
        <LevelSlider label="스트레스" value={stressLevel} onChange={setStressLevel} lowLabel="낮음" highLabel="높음" />
        <LevelSlider label="에너지" value={energyLevel} onChange={setEnergyLevel} lowLabel="낮음" highLabel="높음" />
        <LevelSlider label="졸림" value={sleepiness} onChange={setSleepiness} lowLabel="말짱함" highLabel="졸림" />
        <ChipSelect label="오늘의 목표" options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

        <div>
          <label className="mb-2 block text-sm font-medium text-white">가능한 시간</label>
          <div className="flex gap-2">
            {MINUTE_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAvailableMinutes(m)}
                aria-pressed={availableMinutes === m}
                className={`min-h-[44px] flex-1 rounded-xl border text-sm transition-colors ${
                  availableMinutes === m
                    ? "border-calm-600 bg-calm-600 text-white"
                    : "border-white/15 bg-white/5 text-calm-200"
                }`}
              >
                {m}분
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            더 하고 싶은 이야기가 있다면 (선택)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="예: 내일 발표 때문에 머리가 복잡해요"
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-calm-400 outline-none focus:ring-2 focus:ring-calm-600"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          onClick={handleSubmit}
          className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white"
        >
          맞춤 루틴 받기
        </button>
      </div>
    </PageShell>
  );
}
