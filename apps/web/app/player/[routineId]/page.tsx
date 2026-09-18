"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Mood, RoutineRecord, SessionLogBeforeAfter } from "@app/shared-types";
import { PageShell } from "../../../components/PageShell";
import { ChipSelect } from "../../../components/ChipSelect";
import { LevelSlider } from "../../../components/LevelSlider";
import { getRoutine, startSession, completeSession, getOrCreateLocalUserId } from "../../../lib/api";

const MOOD_OPTIONS: { value: Mood; text: string; emoji: string }[] = [
  { value: "anxious", text: "불안해요", emoji: "😰" },
  { value: "sad", text: "가라앉아요", emoji: "😔" },
  { value: "stressed", text: "스트레스", emoji: "😖" },
  { value: "tired", text: "지쳤어요", emoji: "🥱" },
  { value: "neutral", text: "보통이에요", emoji: "😐" },
  { value: "calm", text: "차분해요", emoji: "🙂" },
  { value: "energetic", text: "활기차요", emoji: "⚡" },
];

type Phase = "loading" | "before" | "playing" | "after" | "done";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerPage() {
  const params = useParams<{ routineId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [routine, setRoutine] = useState<RoutineRecord | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);

  const [beforeState, setBeforeState] = useState<SessionLogBeforeAfter>({ tension: 3, mood: "neutral", sleepiness: 3 });
  const [afterState, setAfterState] = useState<SessionLogBeforeAfter>({ tension: 3, mood: "calm", sleepiness: 3 });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getRoutine(params.routineId)
      .then((r) => {
        setRoutine(r);
        setRemaining(r.steps[0]?.seconds ?? 0);
        setPhase("before");
      })
      .catch(() => setPhase("before"));
  }, [params.routineId]);

  useEffect(() => {
    if (phase !== "playing" || paused || !routine) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setStepIndex((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx >= routine.steps.length) {
              setPhase("after");
              return idx;
            }
            setRemaining(routine.steps[nextIdx].seconds);
            return nextIdx;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, paused, routine]);

  async function handleStart() {
    if (!routine) return;
    try {
      const userId = getOrCreateLocalUserId();
      const { session } = await startSession({ userId, routineId: routine.id, before: beforeState });
      setSessionId(session.id);
      setStepIndex(0);
      setRemaining(routine.steps[0]?.seconds ?? 0);
      setPhase("playing");
    } catch (err) {
      console.error(err);
    }
  }

  function handleFinishSteps() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("after");
  }

  async function handleSubmitAfter() {
    if (!sessionId) {
      setPhase("done");
      return;
    }
    try {
      await completeSession(sessionId, { after: afterState });
    } catch (err) {
      console.error(err);
    }
    setPhase("done");
  }

  if (phase === "loading" || !routine) {
    return (
      <PageShell title="루틴 준비 중">
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-calm-400 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (phase === "before") {
    return (
      <PageShell title={routine.title} subtitle="시작하기 전에 지금 상태를 알려주세요.">
        <div className="space-y-6">
          <LevelSlider
            label="긴장도"
            value={beforeState.tension}
            onChange={(v) => setBeforeState((s) => ({ ...s, tension: v }))}
            lowLabel="편안함"
            highLabel="긴장됨"
          />
          <ChipSelect
            label="기분"
            options={MOOD_OPTIONS}
            value={beforeState.mood}
            onChange={(v) => setBeforeState((s) => ({ ...s, mood: v }))}
          />
          <LevelSlider
            label="졸림"
            value={beforeState.sleepiness}
            onChange={(v) => setBeforeState((s) => ({ ...s, sleepiness: v }))}
            lowLabel="말짱함"
            highLabel="졸림"
          />
          <button onClick={handleStart} className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white">
            시작하기
          </button>
        </div>
      </PageShell>
    );
  }

  if (phase === "playing") {
    const step = routine.steps[stepIndex];
    const progressPct = ((stepIndex + (step.seconds - remaining) / step.seconds) / routine.steps.length) * 100;

    return (
      <PageShell title={routine.title}>
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-calm-600 transition-[width]" style={{ width: `${progressPct}%` }} />
          </div>

          <p className="text-xs uppercase tracking-wide text-calm-400">
            {stepIndex + 1} / {routine.steps.length} 단계
          </p>

          <div className="text-6xl font-light tabular-nums text-white">{formatTime(remaining)}</div>

          <p className="max-w-sm text-center text-base leading-relaxed text-calm-100">{step.instruction}</p>

          <div className="flex gap-3">
            <button
              onClick={() => setPaused((p) => !p)}
              className="min-h-[44px] min-w-[44px] rounded-full border border-white/15 px-6 text-sm text-white"
            >
              {paused ? "재생" : "일시정지"}
            </button>
            <button
              onClick={handleFinishSteps}
              className="min-h-[44px] min-w-[44px] rounded-full border border-white/15 px-6 text-sm text-calm-200"
            >
              종료
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (phase === "after") {
    return (
      <PageShell title="세션을 마쳤어요" subtitle="지금 상태는 어떤가요?">
        <div className="space-y-6">
          <LevelSlider
            label="긴장도"
            value={afterState.tension}
            onChange={(v) => setAfterState((s) => ({ ...s, tension: v }))}
            lowLabel="편안함"
            highLabel="긴장됨"
          />
          <ChipSelect
            label="기분"
            options={MOOD_OPTIONS}
            value={afterState.mood}
            onChange={(v) => setAfterState((s) => ({ ...s, mood: v }))}
          />
          <LevelSlider
            label="졸림"
            value={afterState.sleepiness}
            onChange={(v) => setAfterState((s) => ({ ...s, sleepiness: v }))}
            lowLabel="말짱함"
            highLabel="졸림"
          />
          <button onClick={handleSubmitAfter} className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white">
            기록 저장하기
          </button>
        </div>
      </PageShell>
    );
  }

  const tensionDelta = beforeState.tension - afterState.tension;
  return (
    <PageShell title="수고하셨어요 🌙">
      <div className="space-y-4 text-center">
        <p className="text-4xl">{tensionDelta > 0 ? "😌" : "🙂"}</p>
        <p className="text-sm text-calm-100">
          {tensionDelta > 0
            ? `긴장도가 ${tensionDelta}만큼 낮아졌어요.`
            : "오늘도 루틴을 완료하셨어요. 꾸준함이 가장 중요해요."}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push("/insights")}
            className="min-h-[44px] flex-1 rounded-full bg-calm-600 text-sm font-medium text-white"
          >
            인사이트 보기
          </button>
          <button
            onClick={() => router.push("/checkin")}
            className="min-h-[44px] flex-1 rounded-full border border-white/15 text-sm text-calm-200"
          >
            다시 체크인
          </button>
        </div>
      </div>
    </PageShell>
  );
}
