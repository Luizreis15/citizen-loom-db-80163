import { CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

interface QuizCompleteProps {
  expertName: string;
  calendarLink?: string;
}

export function QuizComplete({ expertName, calendarLink }: QuizCompleteProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-green-500/5 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoDigitalHera} alt="Digital Hera" className="h-14 object-contain" />
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Obrigado, {expertName}! 🎉
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Suas respostas foram enviadas com sucesso. Nossa equipe vai analisar o diagnóstico e entrar em contato em breve.
            </p>
          </div>

          {calendarLink && (
            <Button asChild size="lg" variant="outline" className="w-full rounded-xl h-12 gap-2 font-semibold">
              <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-4 w-4" />
                Agendar reunião
              </a>
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
