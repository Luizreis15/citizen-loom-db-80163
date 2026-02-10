interface QuizProgressProps {
  current: number;
  total: number;
  blockLabel?: string;
}

export function QuizProgress({ current, total, blockLabel }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#7c3aed] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
