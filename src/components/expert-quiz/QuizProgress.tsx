interface QuizProgressProps {
  current: number;
  total: number;
  blockLabel?: string;
}

export function QuizProgress({ current, total, blockLabel }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{blockLabel || `Pergunta ${current + 1} de ${total}`}</span>
        <span className="text-muted-foreground font-medium">{pct}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
