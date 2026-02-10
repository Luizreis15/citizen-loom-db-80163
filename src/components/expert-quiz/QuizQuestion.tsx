import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Send, ChevronUp, ChevronDown } from "lucide-react";
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
        <span className="text-xs font-semibold text-[#7c3aed]/70 uppercase tracking-wider">
          {question.blockLabel}
        </span>
      </div>

      {/* Question */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] text-sm font-bold">
            {questionNumber}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight pt-0.5">
            {question.label}
          </h2>
        </div>
        {!question.required && (
          <p className="text-xs text-muted-foreground ml-11">Opcional</p>
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
                    "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 text-sm md:text-base",
                    isSelected
                      ? "border-[#7c3aed] bg-[#7c3aed]/10 text-foreground"
                      : "border-border/60 hover:border-[#7c3aed]/50 hover:bg-[#7c3aed]/5 text-foreground"
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-colors",
                    isSelected
                      ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                      : "border-border/60 text-muted-foreground"
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
                      "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 text-sm md:text-base",
                      isSelected
                        ? "border-[#7c3aed] bg-[#7c3aed]/10 text-foreground"
                        : "border-border/60 hover:border-[#7c3aed]/50 hover:bg-[#7c3aed]/5 text-foreground"
                    )}
                  >
                    <span className={cn(
                      "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-colors",
                      isSelected
                        ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                        : "border-border/60 text-muted-foreground"
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
                className="rounded-xl h-12 px-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-lg shadow-[#7c3aed]/25 transition-all"
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
              className="min-h-[120px] resize-none rounded-xl border-2 border-border/60 focus:border-[#7c3aed] text-base px-4 py-3 transition-colors"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitText}
                disabled={question.required && !textValue.trim()}
                className="rounded-xl h-12 px-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-lg shadow-[#7c3aed]/25 transition-all"
              >
                OK <Check className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                ou pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd>
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
              className="rounded-xl border-2 border-border/60 focus:border-[#7c3aed] h-14 text-base px-4 transition-colors"
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
                className="rounded-xl h-12 px-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-lg shadow-[#7c3aed]/25 transition-all"
              >
                OK <Check className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                ou pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd>
              </span>
            </div>
          </div>
        )}

        {/* Skip + Back */}
        <div className="flex items-center gap-4 mt-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-muted-foreground hover:text-[#7c3aed] transition-colors flex items-center gap-1"
            >
              <ChevronUp className="h-3 w-3" /> Voltar
            </button>
          )}
          {!question.required && question.type !== "single-select" && question.type !== "multi-select" && (
            <button
              onClick={() => onAnswer("")}
              className="text-xs text-muted-foreground hover:text-[#7c3aed] transition-colors flex items-center gap-1"
            >
              Pular <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
