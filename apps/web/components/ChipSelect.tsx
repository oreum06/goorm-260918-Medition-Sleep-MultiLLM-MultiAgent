export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; text: string; emoji?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-calm-600 bg-calm-600 text-white"
                  : "border-white/15 bg-white/5 text-calm-200 hover:bg-white/10"
              }`}
            >
              {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
