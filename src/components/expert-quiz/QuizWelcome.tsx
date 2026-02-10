import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Shield, Sparkles } from "lucide-react";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

interface QuizWelcomeProps {
  expertName: string;
  onStart: () => void;
}

export function QuizWelcome({ expertName, onStart }: QuizWelcomeProps) {
  const [consent, setConsent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/5 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoDigitalHera} alt="Digital Hera" className="h-14 object-contain" />
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Olá, {expertName}! 👋
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Vamos montar juntos o diagnóstico e escopo do seu produto digital. Responda algumas perguntas rápidas para começarmos.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>8–12 min</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-700 rounded-full px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>Dados protegidos</span>
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(!!checked)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Concordo em compartilhar essas informações para fins de diagnóstico e elaboração de proposta, conforme a LGPD.
            </label>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            disabled={!consent}
            onClick={onStart}
            className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all"
          >
            Começar diagnóstico 🚀
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
