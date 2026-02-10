import { CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

interface QuizCompleteProps {
  expertName: string;
  calendarLink?: string;
}

export function QuizComplete({ expertName, calendarLink }: QuizCompleteProps) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#7c3aed]/10 via-background to-emerald-500/5 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={logoDigitalHera} alt="Digital Hera" className="h-14 object-contain" />
        </div>

        {/* Content */}
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Obrigado, {expertName}! 🎉
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Suas respostas foram enviadas com sucesso. Nossa equipe vai analisar o diagnóstico e entrar em contato em breve.
            </p>
          </div>

          {calendarLink && (
            <Button asChild size="lg" variant="outline" className="w-full rounded-xl h-14 gap-2 font-semibold border-2">
              <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-5 w-5" />
                Agendar reunião
              </a>
            </Button>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-10">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
