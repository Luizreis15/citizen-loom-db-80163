import { cn } from "@/lib/utils";

interface QuizChatBubbleProps {
  message: string;
  isUser?: boolean;
  animate?: boolean;
}

export function QuizChatBubble({ message, isUser = false, animate = true }: QuizChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isUser ? "justify-end" : "justify-start",
        animate && "animate-fade-in"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {message}
      </div>
    </div>
  );
}
