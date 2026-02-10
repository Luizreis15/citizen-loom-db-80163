import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Shield } from "lucide-react";

interface QuizWelcomeProps {
  expertName: string;
  onStart: () => void;
}

export function QuizWelcome({ expertName, onStart }: QuizWelcomeProps) {
  const [consent, setConsent] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in px-4">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Olá, {expertName}! 👋
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md">
          Vamos montar juntos o diagnóstico e escopo do seu produto digital. Responda algumas perguntas rápidas para começarmos.
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>8–12 minutos</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          <span>Dados protegidos</span>
        </div>
      </div>

      <div className="flex items-start gap-2 max-w-sm text-left">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(!!checked)}
          className="mt-0.5"
        />
        <label htmlFor="consent" className="text-sm text-muted-foreground leading-tight cursor-pointer">
          Concordo em compartilhar essas informações para fins de diagnóstico e elaboração de proposta, conforme a LGPD.
        </label>
      </div>

      <Button
        size="lg"
        disabled={!consent}
        onClick={onStart}
        className="rounded-full px-8"
      >
        Começar diagnóstico
      </Button>
    </div>
  );
}
