import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ChevronUp, ChevronDown } from "lucide-react";
import type { QuizQuestion as QuizQuestionType } from "./quizSchema";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  onAnswer: (value: string) => void;
  onBack?: () => void;
  defaultValue?: string;
}

export function QuizQuestion({ question, questionNumber, onAnswer, onBack, defaultValue }: QuizQuestionProps) {
  const [textValue, setTextValue] = useState(defaultValue || "");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    if (!defaultValue) return [];
    try {
      const parsed = JSON.parse(defaultValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return defaultValue ? [defaultValue] : [];
    }
  });

  const handleSubmitText = () => {
    if (textValue.trim() || !question.required) {
      onAnswer(textValue.trim());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Block label */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#c9a84c]/60 uppercase tracking-[0.2em]">
          {question.blockLabel}
        </span>
      </div>

      {/* Question */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#c9a84c]/10 text-[#c9a84c] text-sm font-semibold">
            {questionNumber}
          </span>
          <h2 className="text-xl md:text-2xl font-medium text-[#f5f0e8] leading-tight pt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
            {question.label}
          </h2>
        </div>
        {!question.required && (
          <p className="text-xs text-[#9ca3af]/60 ml-11 tracking-wide">Opcional</p>
        )}
      </div>

      {/* Input area */}
      <div className="ml-11">
        {question.type === "single-select" && question.options ? (
          <div className="space-y-2">
            {question.options.map((option, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedOptions.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => onAnswer(option)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 text-sm md:text-base",
                    isSelected
                      ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#f5f0e8]"
                      : "border-[#2a2a3e] hover:border-[#c9a84c]/30 hover:bg-[#2a2a3e]/50 text-[#f5f0e8]/80"
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold border transition-colors",
                    isSelected
                      ? "border-[#c9a84c] bg-[#c9a84c] text-[#1a1a2e]"
                      : "border-[#3a3a4e] text-[#9ca3af]"
                  )}>
                    {letter}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        ) : question.type === "multi-select" && question.options ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {question.options.map((option, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedOptions.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedOptions((prev) =>
                        prev.includes(option)
                          ? prev.filter((o) => o !== option)
                          : [...prev, option]
                      );
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 text-sm md:text-base",
                      isSelected
                        ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#f5f0e8]"
                        : "border-[#2a2a3e] hover:border-[#c9a84c]/30 hover:bg-[#2a2a3e]/50 text-[#f5f0e8]/80"
                    )}
                  >
                    <span className={cn(
                      "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold border transition-colors",
                      isSelected
                        ? "border-[#c9a84c] bg-[#c9a84c] text-[#1a1a2e]"
                        : "border-[#3a3a4e] text-[#9ca3af]"
                    )}>
                      {isSelected ? <Check className="h-4 w-4" /> : letter}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>
            {selectedOptions.length > 0 && (
              <Button
                onClick={() => onAnswer(JSON.stringify(selectedOptions))}
                className="rounded-xl h-12 px-8 bg-gradient-to-r from-[#c9a84c] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c9a84c] text-[#1a1a2e] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all tracking-wide"
              >
                OK <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        ) : question.type === "textarea" ? (
          <div className="space-y-4">
            <Textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={question.placeholder || "Digite sua resposta..."}
              className="min-h-[120px] resize-none rounded-xl border border-[#2a2a3e] bg-transparent focus:border-[#c9a84c]/60 text-base px-4 py-3 transition-colors text-[#f5f0e8] placeholder:text-[#9ca3af]/40"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitText}
                disabled={question.required && !textValue.trim()}
                className="rounded-xl h-12 px-8 bg-gradient-to-r from-[#c9a84c] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c9a84c] text-[#1a1a2e] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all tracking-wide disabled:opacity-40"
              >
                OK <Check className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-[#9ca3af]/40">
                ou pressione <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[10px] font-mono text-[#9ca3af]/60">Enter</kbd>
              </span>
            </div>
          </div>
        ) : (
          /* text, email, url, phone */
          <div className="space-y-4">
            <Input
              type={question.type === "email" ? "email" : question.type === "url" ? "url" : question.type === "phone" ? "tel" : "text"}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={question.placeholder || "Digite sua resposta..."}
              className="rounded-xl border border-[#2a2a3e] bg-transparent focus:border-[#c9a84c]/60 h-14 text-base px-4 transition-colors text-[#f5f0e8] placeholder:text-[#9ca3af]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmitText();
                }
              }}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitText}
                disabled={question.required && !textValue.trim()}
                className="rounded-xl h-12 px-8 bg-gradient-to-r from-[#c9a84c] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c9a84c] text-[#1a1a2e] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all tracking-wide disabled:opacity-40"
              >
                OK <Check className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-[#9ca3af]/40">
                ou pressione <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[10px] font-mono text-[#9ca3af]/60">Enter</kbd>
              </span>
            </div>
          </div>
        )}

        {/* Skip + Back */}
        <div className="flex items-center gap-4 mt-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-[#9ca3af]/60 hover:text-[#c9a84c] transition-colors flex items-center gap-1 tracking-wide"
            >
              <ChevronUp className="h-3 w-3" /> Voltar
            </button>
          )}
          {!question.required && question.type !== "single-select" && question.type !== "multi-select" && (
            <button
              onClick={() => onAnswer("")}
              className="text-xs text-[#9ca3af]/60 hover:text-[#c9a84c] transition-colors flex items-center gap-1 tracking-wide"
            >
              Pular <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
