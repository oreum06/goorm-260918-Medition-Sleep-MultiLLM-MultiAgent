"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "../../components/PageShell";
import { LevelSlider } from "../../components/LevelSlider";
import { createSleepLog, getOrCreateLocalUserId } from "../../lib/api";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultDateTimeLocal(hoursOffset: number): string {
  const d = new Date(Date.now() + hoursOffset * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function SleepLogPage() {
  const router = useRouter();
  const [sleepDate, setSleepDate] = useState(todayISODate());
  const [bedAt, setBedAt] = useState(defaultDateTimeLocal(-8));
  const [wakeAt, setWakeAt] = useState(defaultDateTimeLocal(0));
  const [latencyMinutes, setLatencyMinutes] = useState(15);
  const [awakenings, setAwakenings] = useState(0);
  const [quality, setQuality] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const userId = getOrCreateLocalUserId();
      await createSleepLog({
        userId,
        sleepDate,
        bedAt: new Date(bedAt).toISOString(),
        wakeAt: new Date(wakeAt).toISOString(),
        latencyMinutes,
        awakenings,
        quality,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <PageShell title="수면 기록 완료">
        <div className="space-y-4 text-center">
          <p className="text-3xl">🌙</p>
          <p className="text-sm text-calm-100">오늘의 수면 기록을 저장했어요.</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/insights")}
              className="min-h-[44px] flex-1 rounded-full bg-calm-600 text-sm font-medium text-white"
            >
              인사이트 보기
            </button>
            <button
              onClick={() => setSaved(false)}
              className="min-h-[44px] flex-1 rounded-full border border-white/15 text-sm text-calm-200"
            >
              다시 기록하기
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="수면 체크인" subtitle="어젯밤 수면은 어떠셨나요?">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">날짜</label>
          <input
            type="date"
            value={sleepDate}
            onChange={(e) => setSleepDate(e.target.value)}
            className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-calm-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">취침 시각</label>
            <input
              type="datetime-local"
              value={bedAt}
              onChange={(e) => setBedAt(e.target.value)}
              className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-calm-600"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white">기상 시각</label>
            <input
              type="datetime-local"
              value={wakeAt}
              onChange={(e) => setWakeAt(e.target.value)}
              className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-calm-600"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">잠드는 데 걸린 시간 (분)</label>
          <input
            type="number"
            min={0}
            value={latencyMinutes}
            onChange={(e) => setLatencyMinutes(Number(e.target.value))}
            className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-calm-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">밤중에 깬 횟수</label>
          <input
            type="number"
            min={0}
            value={awakenings}
            onChange={(e) => setAwakenings(Number(e.target.value))}
            className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-calm-600"
          />
        </div>

        <LevelSlider label="수면 만족도" value={quality} onChange={setQuality} lowLabel="별로예요" highLabel="좋았어요" />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </PageShell>
  );
}
