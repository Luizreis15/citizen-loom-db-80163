import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Send } from "lucide-react";
import type { QuizQuestion } from "./quizSchema";

interface QuizInputProps {
  question: QuizQuestion;
  onAnswer: (value: string) => void;
  defaultValue?: string;
}

export function QuizInput({ question, onAnswer, defaultValue }: QuizInputProps) {
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

  if (question.type === "single-select" && question.options) {
    return (
      <div className="flex flex-wrap gap-2 animate-fade-in">
        {question.options.map((option) => (
          <Button
            key={option}
            variant={selectedOptions.includes(option) ? "default" : "outline"}
            size="sm"
            className="rounded-full text-sm"
            onClick={() => onAnswer(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    );
  }

  if (question.type === "multi-select" && question.options) {
    const toggle = (option: string) => {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    };
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const active = selectedOptions.includes(option);
            return (
              <Button
                key={option}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn("rounded-full text-sm", active && "gap-1")}
                onClick={() => toggle(option)}
              >
                {active && <Check className="h-3 w-3" />}
                {option}
              </Button>
            );
          })}
        </div>
        {selectedOptions.length > 0 && (
          <Button size="sm" onClick={() => onAnswer(JSON.stringify(selectedOptions))} className="gap-1">
            <Send className="h-3 w-3" /> Confirmar
          </Button>
        )}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <div className="flex gap-2 animate-fade-in">
        <Textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={question.placeholder || "Digite sua resposta..."}
          className="min-h-[80px] flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && textValue.trim()) {
              e.preventDefault();
              onAnswer(textValue.trim());
            }
          }}
        />
        <Button
          size="icon"
          onClick={() => textValue.trim() && onAnswer(textValue.trim())}
          disabled={!textValue.trim()}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // text, email, url, phone
  return (
    <div className="flex gap-2 animate-fade-in">
      <Input
        type={question.type === "email" ? "email" : question.type === "url" ? "url" : question.type === "phone" ? "tel" : "text"}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder={question.placeholder || "Digite sua resposta..."}
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (textValue.trim() || !question.required)) {
            e.preventDefault();
            onAnswer(textValue.trim());
          }
        }}
      />
      <Button
        size="icon"
        onClick={() => onAnswer(textValue.trim())}
        disabled={question.required && !textValue.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
