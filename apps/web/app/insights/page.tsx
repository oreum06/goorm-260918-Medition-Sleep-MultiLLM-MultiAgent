"use client";

import { useEffect, useState } from "react";
import type { WeeklyInsightResponse } from "@app/shared-types";
import { PageShell } from "../../components/PageShell";
import { WeeklyChart } from "../../components/WeeklyChart";
import { getWeeklyInsight, generateWeeklyInsight, getOrCreateLocalUserId } from "../../lib/api";

export default function InsightsPage() {
  const [data, setData] = useState<WeeklyInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const userId = getOrCreateLocalUserId();
    getWeeklyInsight(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const userId = getOrCreateLocalUserId();
      const fresh = await generateWeeklyInsight(userId);
      setData(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="주간 인사이트">
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-calm-400 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const insight = data?.latest?.insight;

  return (
    <PageShell title="주간 인사이트" subtitle="지난 7일간의 기록을 살펴봐요.">
      <div className="space-y-5">
        <WeeklyChart checkins={data?.dailyCheckins ?? []} sleepLogs={data?.sleepLogs ?? []} />

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "분석 중..." : "이번 주 인사이트 생성하기"}
        </button>

        {insight ? (
          <div className="space-y-4">
            <section>
              <h2 className="mb-2 text-sm font-semibold text-white">관찰된 패턴</h2>
              <ul className="space-y-1.5">
                {insight.observations.map((obs, i) => (
                  <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-calm-100">
                    {obs}
                  </li>
                ))}
              </ul>
            </section>

            {insight.uncertainties.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-white">확실하지 않은 부분</h2>
                <ul className="space-y-1.5">
                  {insight.uncertainties.map((u, i) => (
                    <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-calm-300">
                      {u}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-calm-400/30 bg-calm-800/40 p-4">
              <h2 className="mb-1 text-sm font-semibold text-white">다음 주 작은 실험</h2>
              <p className="text-sm text-calm-100">{insight.nextAction}</p>
            </section>
          </div>
        ) : (
          <p className="text-sm text-calm-300">
            아직 생성된 인사이트가 없어요. 위 버튼을 눌러 이번 주 기록을 분석해보세요.
          </p>
        )}
      </div>
    </PageShell>
  );
}
