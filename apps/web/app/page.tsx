"use client";

import Link from "next/link";
import { PageShell } from "../components/PageShell";

const ACTIONS = [
  {
    href: "/checkin",
    title: "오늘의 체크인",
    subtitle: "지금 상태를 알려주면 맞춤 루틴을 만들어드려요",
    gradient: "from-[#1a2b6b] to-[#3a5bb8]",
    emoji: "✨",
  },
  {
    href: "/sleep-log",
    title: "수면 체크인",
    subtitle: "어젯밤 수면을 기록해보세요",
    gradient: "from-[#1a4a80] to-[#3a86c8]",
    emoji: "🌙",
  },
  {
    href: "/insights",
    title: "주간 인사이트",
    subtitle: "지난 7일간의 패턴을 확인해보세요",
    gradient: "from-[#0f3d3d] to-[#2c8c7a]",
    emoji: "📈",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-calm-400">MindFlow AI</p>
        <h1 className="text-2xl font-semibold leading-snug text-white">
          오늘 하루,
          <br />
          마음은 어떠셨나요?
        </h1>
      </div>

      <div className="space-y-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`block rounded-2xl bg-gradient-to-br ${a.gradient} p-5 shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{a.emoji}</span>
              <div>
                <h2 className="text-lg font-medium text-white">{a.title}</h2>
                <p className="text-sm text-calm-200">{a.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
