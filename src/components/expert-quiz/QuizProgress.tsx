interface QuizProgressProps {
  current: number;
  total: number;
  blockLabel?: string;
}

export function QuizProgress({ current, total, blockLabel }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#2a2a3e]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#d4af37] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
