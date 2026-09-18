import type { RoutinePlan, RoutineStepType } from "@app/shared-types";

const STEP_ICON: Record<RoutineStepType, string> = {
  breathing: "🫁",
  body_scan: "🧘",
  meditation: "🪷",
  sleep_story: "🌙",
  grounding: "🌿",
  closing: "🕊️",
};

export function RoutineCard({
  plan,
  highlighted,
  onSelect,
}: {
  plan: RoutinePlan;
  highlighted?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted ? "border-calm-400 bg-calm-800/60" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{plan.title}</h3>
        <span className="text-xs text-calm-200">{plan.durationMinutes}분</span>
      </div>
      <p className="mb-3 text-sm text-calm-200">{plan.reason}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {plan.steps.map((step, i) => (
          <span
            key={i}
            className="rounded-full bg-white/10 px-2 py-1 text-xs text-calm-100"
            title={step.instruction}
          >
            {STEP_ICON[step.type]} {Math.round(step.seconds / 60) || 1}분
          </span>
        ))}
      </div>
      <button
        onClick={onSelect}
        className="min-h-[44px] w-full rounded-full bg-calm-600 text-sm font-medium text-white transition-transform hover:scale-[1.01]"
      >
        이 루틴 시작하기
      </button>
    </div>
  );
}
