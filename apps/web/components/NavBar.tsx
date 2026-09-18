"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/checkin", label: "체크인", icon: "✨" },
  { href: "/sleep-log", label: "수면기록", icon: "🌙" },
  { href: "/insights", label: "인사이트", icon: "📈" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0b1f3a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-xs transition-colors ${
                active ? "text-white" : "text-calm-400"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
