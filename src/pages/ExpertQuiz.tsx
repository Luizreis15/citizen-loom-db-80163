import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuizWelcome } from "@/components/expert-quiz/QuizWelcome";
import { QuizComplete } from "@/components/expert-quiz/QuizComplete";
import { QuizQuestion as QuizQuestionComponent } from "@/components/expert-quiz/QuizQuestion";
import { QuizProgress } from "@/components/expert-quiz/QuizProgress";
import { getVisibleQuestions } from "@/components/expert-quiz/quizSchema";
import { Loader2, AlertCircle } from "lucide-react";
import logoDigitalHera from "@/assets/logo-digital-hera.png";

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
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);

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

      const { data: resps } = await supabase
        .from("expert_onboarding_responses")
        .select("field_key, value")
        .eq("onboarding_id", ob.id);

      const saved: Record<string, string> = {};
      resps?.forEach((r) => { if (r.value) saved[r.field_key] = r.value; });
      setAnswers(saved);

      const visible = getVisibleQuestions(saved);
      const answeredCount = visible.filter((q) => saved[q.key]).length;

      if (ob.consent_accepted && answeredCount > 0) {
        setCurrentIdx(Math.min(answeredCount, visible.length - 1));
        setPageState("quiz");
      } else if (ob.consent_accepted) {
        setPageState("quiz");
      } else {
        setPageState("welcome");
      }
    })();
  }, [token]);

  const handleStart = useCallback(async () => {
    if (!onboarding) return;
    await supabase
      .from("expert_onboardings")
      .update({ consent_accepted: true, consent_at: new Date().toISOString(), status: "in_progress" })
      .eq("id", onboarding.id);
    setOnboarding((prev) => prev ? { ...prev, consent_accepted: true, status: "in_progress" } : prev);
    setPageState("quiz");
  }, [onboarding]);

  const visibleQuestions = getVisibleQuestions(answers);

  const goToQuestion = useCallback((nextIdx: number, dir: "next" | "prev") => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIdx(nextIdx);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const handleAnswer = useCallback(async (key: string, blockId: string, value: string) => {
    if (!onboarding) return;

    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    await supabase.from("expert_onboarding_responses").upsert(
      { onboarding_id: onboarding.id, block_id: blockId, field_key: key, value },
      { onConflict: "onboarding_id,field_key" }
    );

    const visible = getVisibleQuestions(newAnswers);
    const curQIdx = visible.findIndex((q) => q.key === key);
    const nextIdx = curQIdx + 1;

    if (nextIdx >= visible.length) {
      await supabase
        .from("expert_onboardings")
        .update({ status: "completed", completed_at: new Date().toISOString(), current_block: 10 })
        .eq("id", onboarding.id);
      setPageState("complete");
    } else {
      goToQuestion(nextIdx, "next");

      const nextBlock = visible[nextIdx]?.block;
      const blockNum = parseInt(nextBlock?.replace("bloco_", "") || "0");
      await supabase
        .from("expert_onboardings")
        .update({ current_block: blockNum })
        .eq("id", onboarding.id);
    }
  }, [onboarding, answers, goToQuestion]);

  const handleBack = useCallback(() => {
    if (currentIdx > 0) {
      goToQuestion(currentIdx - 1, "prev");
    }
  }, [currentIdx, goToQuestion]);

  if (pageState === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] gap-4 px-4">
        <img src={logoDigitalHera} alt="Digital Hera" className="h-12 object-contain" />
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-lg text-[#9ca3af] text-center">{errorMsg}</p>
      </div>
    );
  }

  if (pageState === "welcome" && onboarding) {
    return <QuizWelcome expertName={onboarding.expert_name} onStart={handleStart} />;
  }

  if (pageState === "complete" && onboarding) {
    return <QuizComplete expertName={onboarding.expert_name} />;
  }

  const currentQuestion = visibleQuestions[currentIdx];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 z-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <img src={logoDigitalHera} alt="Digital Hera" className="h-7 object-contain" />
            <span className="text-xs text-[#c9a84c]/70 font-medium tracking-wider">
              {currentIdx + 1} / {visibleQuestions.length}
            </span>
          </div>
          <QuizProgress
            current={currentIdx}
            total={visibleQuestions.length}
            blockLabel={currentQuestion.blockLabel}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className={`w-full max-w-xl transition-all duration-300 ease-out ${
            isAnimating
              ? direction === "next"
                ? "opacity-0 translate-y-8"
                : "opacity-0 -translate-y-8"
              : "opacity-100 translate-y-0"
          }`}
        >
          <QuizQuestionComponent
            question={currentQuestion}
            questionNumber={currentIdx + 1}
            defaultValue={answers[currentQuestion.key]}
            onAnswer={(val) => handleAnswer(currentQuestion.key, currentQuestion.block, val)}
            onBack={currentIdx > 0 ? handleBack : undefined}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-center text-[10px] text-[#9ca3af]/40 tracking-wider">
          Powered by Digital Hera
        </p>
      </div>
    </div>
  );
}
