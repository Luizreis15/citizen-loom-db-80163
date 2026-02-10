import { CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizCompleteProps {
  expertName: string;
  calendarLink?: string;
}

export function QuizComplete({ expertName, calendarLink }: QuizCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in px-4">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Obrigado, {expertName}! 🎉
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md">
          Suas respostas foram enviadas com sucesso. Nossa equipe vai analisar o diagnóstico e entrar em contato em breve.
        </p>
      </div>

      {calendarLink && (
        <Button asChild size="lg" variant="outline" className="rounded-full gap-2">
          <a href={calendarLink} target="_blank" rel="noopener noreferrer">
            <Calendar className="h-4 w-4" />
            Agendar reunião
          </a>
        </Button>
      )}
    </div>
  );
}
