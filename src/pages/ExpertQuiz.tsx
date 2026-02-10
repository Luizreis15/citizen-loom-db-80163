import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuizWelcome } from "@/components/expert-quiz/QuizWelcome";
import { QuizComplete } from "@/components/expert-quiz/QuizComplete";
import { QuizChatBubble } from "@/components/expert-quiz/QuizChatBubble";
import { QuizInput } from "@/components/expert-quiz/QuizInput";
import { QuizProgress } from "@/components/expert-quiz/QuizProgress";
import { getVisibleQuestions } from "@/components/expert-quiz/quizSchema";
import { Loader2, AlertCircle } from "lucide-react";

type PageState = "loading" | "welcome" | "quiz" | "complete" | "error";

interface OnboardingData {
  id: string;
  expert_name: string;
  expert_email: string;
  status: string;
  consent_accepted: boolean;
}

export default function ExpertQuiz() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load onboarding + existing answers
  useEffect(() => {
    if (!token) { setPageState("error"); setErrorMsg("Link inválido."); return; }

    (async () => {
      const { data: ob, error } = await supabase
        .from("expert_onboardings")
        .select("id, expert_name, expert_email, status, consent_accepted, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (error || !ob) { setPageState("error"); setErrorMsg("Link inválido ou expirado."); return; }
      if (new Date(ob.expires_at) < new Date()) { setPageState("error"); setErrorMsg("Este link expirou."); return; }
      if (ob.status === "completed") { setPageState("complete"); setOnboarding(ob); return; }

      setOnboarding(ob);

      // Load existing answers
      const { data: resps } = await supabase
        .from("expert_onboarding_responses")
        .select("field_key, value")
        .eq("onboarding_id", ob.id);

      const saved: Record<string, string> = {};
      resps?.forEach((r) => { if (r.value) saved[r.field_key] = r.value; });
      setAnswers(saved);

      // Resume position
      const visible = getVisibleQuestions(saved);
      const answeredCount = visible.filter((q) => saved[q.key]).length;

      if (ob.consent_accepted && answeredCount > 0) {
        setCurrentIdx(Math.min(answeredCount, visible.length));
        setPageState("quiz");
      } else if (ob.consent_accepted) {
        setPageState("quiz");
      } else {
        setPageState("welcome");
      }
    })();
  }, [token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentIdx, pageState]);

  const handleStart = useCallback(async () => {
    if (!onboarding) return;
    await supabase
      .from("expert_onboardings")
      .update({ consent_accepted: true, consent_at: new Date().toISOString(), status: "in_progress" })
      .eq("id", onboarding.id);
    setOnboarding((prev) => prev ? { ...prev, consent_accepted: true, status: "in_progress" } : prev);
    setPageState("quiz");
  }, [onboarding]);

  const handleAnswer = useCallback(async (key: string, blockId: string, value: string) => {
    if (!onboarding) return;

    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    // Upsert response
    await supabase.from("expert_onboarding_responses").upsert(
      { onboarding_id: onboarding.id, block_id: blockId, field_key: key, value },
      { onConflict: "onboarding_id,field_key" }
    );

    // Move to next visible question
    const visible = getVisibleQuestions(newAnswers);
    const curQIdx = visible.findIndex((q) => q.key === key);
    const nextIdx = curQIdx + 1;

    if (nextIdx >= visible.length) {
      // All done
      await supabase
        .from("expert_onboardings")
        .update({ status: "completed", completed_at: new Date().toISOString(), current_block: 10 })
        .eq("id", onboarding.id);
      setPageState("complete");
    } else {
      setCurrentIdx(nextIdx);
      // Update current_block
      const nextBlock = visible[nextIdx]?.block;
      const blockNum = parseInt(nextBlock?.replace("bloco_", "") || "0");
      await supabase
        .from("expert_onboardings")
        .update({ current_block: blockNum })
        .eq("id", onboarding.id);
    }
  }, [onboarding, answers]);

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{errorMsg}</p>
      </div>
    );
  }

  if (pageState === "welcome" && onboarding) {
    return (
      <div className="min-h-screen bg-background">
        <QuizWelcome expertName={onboarding.expert_name} onStart={handleStart} />
      </div>
    );
  }

  if (pageState === "complete" && onboarding) {
    return (
      <div className="min-h-screen bg-background">
        <QuizComplete expertName={onboarding.expert_name} />
      </div>
    );
  }

  // Quiz state
  const visibleQuestions = getVisibleQuestions(answers);
  const answeredQuestions = visibleQuestions.slice(0, currentIdx);
  const currentQuestion = visibleQuestions[currentIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          <QuizProgress
            current={currentIdx}
            total={visibleQuestions.length}
            blockLabel={currentQuestion?.blockLabel}
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
          {/* Intro message */}
          <QuizChatBubble message={`Ótimo, ${onboarding?.expert_name}! Vamos começar. 🚀`} animate={false} />

          {/* Answered questions */}
          {answeredQuestions.map((q, i) => {
            const prevBlock = i > 0 ? answeredQuestions[i - 1]?.block : null;
            const showBlockHeader = q.block !== prevBlock;
            const answerVal = answers[q.key] || "";
            let displayAnswer = answerVal;
            try {
              const parsed = JSON.parse(answerVal);
              if (Array.isArray(parsed)) displayAnswer = parsed.join(", ");
            } catch { /* not json */ }

            return (
              <div key={q.key}>
                {showBlockHeader && (
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                    {q.blockLabel}
                  </div>
                )}
                <QuizChatBubble message={q.label} animate={false} />
                {answerVal && <QuizChatBubble message={displayAnswer} isUser animate={false} />}
              </div>
            );
          })}

          {/* Current question */}
          {currentQuestion && (
            <div>
              {(currentIdx === 0 || currentQuestion.block !== answeredQuestions[answeredQuestions.length - 1]?.block) && (
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                  {currentQuestion.blockLabel}
                </div>
              )}
              <QuizChatBubble message={currentQuestion.label} />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      {currentQuestion && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-4 z-10">
          <div className="max-w-2xl mx-auto">
            <QuizInput
              key={currentQuestion.key}
              question={currentQuestion}
              defaultValue={answers[currentQuestion.key]}
              onAnswer={(val) => handleAnswer(currentQuestion.key, currentQuestion.block, val)}
            />
            {!currentQuestion.required && currentQuestion.type !== "single-select" && currentQuestion.type !== "multi-select" && (
              <button
                onClick={() => handleAnswer(currentQuestion.key, currentQuestion.block, "")}
                className="text-xs text-muted-foreground mt-2 hover:underline"
              >
                Pular →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
