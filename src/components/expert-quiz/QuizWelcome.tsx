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
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={logoDigitalHera} alt="Digital Hera" className="h-14 object-contain" />
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#f5f0e8] tracking-tight">
              Olá, {expertName}
            </h1>
            <p className="text-[#9ca3af] text-base md:text-lg leading-relaxed">
              Vamos montar juntos o diagnóstico e escopo do seu produto digital. Responda algumas perguntas rápidas para começarmos.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#c9a84c]/10 text-[#c9a84c] rounded-full px-3 py-1.5 text-xs font-medium tracking-wide">
              <Clock className="h-3.5 w-3.5" />
              <span>8–12 min</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#2a2a3e] text-[#9ca3af] rounded-full px-3 py-1.5 text-xs font-medium tracking-wide">
              <Shield className="h-3.5 w-3.5" />
              <span>Dados protegidos</span>
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 bg-[#2a2a3e]/60 backdrop-blur-sm rounded-xl p-4 border border-[#c9a84c]/10">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(!!checked)}
              className="mt-0.5 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c] border-[#3a3a4e]"
            />
            <label htmlFor="consent" className="text-sm text-[#9ca3af] leading-relaxed cursor-pointer">
              Concordo em compartilhar essas informações para fins de diagnóstico e elaboração de proposta, conforme a LGPD.
            </label>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            disabled={!consent}
            onClick={onStart}
            className="w-full rounded-xl h-14 text-base font-semibold bg-gradient-to-r from-[#c9a84c] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c9a84c] text-[#1a1a2e] shadow-lg shadow-[#c9a84c]/20 transition-all gap-2 tracking-wide disabled:opacity-40"
          >
            Começar <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#9ca3af]/40 mt-10 tracking-wider">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
