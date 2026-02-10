import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Shield, ArrowRight } from "lucide-react";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

interface QuizWelcomeProps {
  expertName: string;
  onStart: () => void;
}

export function QuizWelcome({ expertName, onStart }: QuizWelcomeProps) {
  const [consent, setConsent] = useState(false);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#7c3aed]/10 via-background to-[#7c3aed]/5 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={logoDigitalHera} alt="Digital Hera" className="h-14 object-contain" />
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Olá, {expertName}! 👋
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Vamos montar juntos o diagnóstico e escopo do seu produto digital. Responda algumas perguntas rápidas para começarmos.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#7c3aed]/10 text-[#7c3aed] rounded-full px-3 py-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>8–12 min</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>Dados protegidos</span>
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-4">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(!!checked)}
              className="mt-0.5 data-[state=checked]:bg-[#7c3aed] data-[state=checked]:border-[#7c3aed]"
            />
            <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Concordo em compartilhar essas informações para fins de diagnóstico e elaboração de proposta, conforme a LGPD.
            </label>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            disabled={!consent}
            onClick={onStart}
            className="w-full rounded-xl h-14 text-base font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/25 transition-all gap-2"
          >
            Começar <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/60 mt-10">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
