export function CrisisNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-5 text-sm leading-relaxed text-amber-100">
      <p className="mb-2 text-base font-medium">🤍 잠시 멈춰서 살펴봐 주세요</p>
      <p>{message}</p>
    </div>
  );
}
