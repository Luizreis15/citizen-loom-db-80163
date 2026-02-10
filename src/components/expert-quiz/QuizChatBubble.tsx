import { cn } from "@/lib/utils";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

interface QuizChatBubbleProps {
  message: string;
  isUser?: boolean;
  animate?: boolean;
  isTyping?: boolean;
}

export function QuizChatBubble({ message, isUser = false, animate = true, isTyping = false }: QuizChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-3 gap-2",
        isUser ? "justify-end" : "justify-start",
        animate && "animate-fade-in"
      )}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={logoDigitalHera} alt="" className="h-5 w-5 object-contain" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border/60 text-foreground rounded-bl-sm"
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1 py-1 px-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          message
        )}
      </div>

      {/* Spacer for user messages to align with avatar */}
      {isUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
