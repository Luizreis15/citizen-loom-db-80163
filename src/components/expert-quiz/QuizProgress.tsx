import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
  blockLabel?: string;
}

export function QuizProgress({ current, total, blockLabel }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{blockLabel || `Pergunta ${current} de ${total}`}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
