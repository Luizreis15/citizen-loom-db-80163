import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  steps: { key: string; title: string }[];
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingProgress({ steps, currentStep, completedSteps }: OnboardingProgressProps) {
  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progresso</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      
      <div className="flex flex-wrap gap-2 mt-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
                isCompleted && "bg-primary/10 text-primary",
                isCurrent && !isCompleted && "bg-accent text-accent-foreground",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <CircleDot className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span>{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
