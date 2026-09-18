"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DailyCheckinRecord, SleepLogRecord } from "@app/shared-types";

const COLORS = {
  stress: "#3987e5", // 카테고리 슬롯 1 (blue)
  energy: "#d95926", // 카테고리 슬롯 2 (orange)
  quality: "#199e70", // 카테고리 슬롯 3 (aqua)
};

const CHART_SURFACE = "#12294f";
const GRID_COLOR = "#2c3f61";
const AXIS_COLOR = "#7f97c2";

interface ChartRow {
  date: string;
  stressLevel: number | null;
  energyLevel: number | null;
  sleepQuality: number | null;
}

function buildRows(checkins: DailyCheckinRecord[], sleepLogs: SleepLogRecord[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();

  for (const c of [...checkins].reverse()) {
    const date = c.createdAt.slice(5, 10); // MM-DD
    const existing = byDate.get(date) ?? { date, stressLevel: null, energyLevel: null, sleepQuality: null };
    existing.stressLevel = c.stressLevel;
    existing.energyLevel = c.energyLevel;
    byDate.set(date, existing);
  }

  for (const s of [...sleepLogs].reverse()) {
    const date = s.sleepDate.slice(5, 10);
    const existing = byDate.get(date) ?? { date, stressLevel: null, energyLevel: null, sleepQuality: null };
    existing.sleepQuality = s.quality;
    byDate.set(date, existing);
  }

  return Array.from(byDate.values()).slice(-7);
}

export function WeeklyChart({ checkins, sleepLogs }: { checkins: DailyCheckinRecord[]; sleepLogs: SleepLogRecord[] }) {
  const rows = buildRows(checkins, sleepLogs);

  if (rows.length === 0) {
    return <p className="text-sm text-calm-300">아직 표시할 기록이 없어요.</p>;
  }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: CHART_SURFACE }}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke={AXIS_COLOR}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{ background: "#0b1f3a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#c9e8f7" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#c9e8f7" }} />
          <Line type="monotone" dataKey="stressLevel" name="스트레스" stroke={COLORS.stress} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="energyLevel" name="에너지" stroke={COLORS.energy} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="sleepQuality" name="수면 만족도" stroke={COLORS.quality} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
