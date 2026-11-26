"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight, ChevronDown, Layers, Sparkles } from "@gravity-ui/icons";
import { createPlanAction } from "@/app/actions/plan";
import { MascotBee } from "@/app/components/mascot-bee";
import { BeeLoader } from "@/app/components/bee-loader";
import type { PlanCreationPrompts } from "@/lib/plan/learner-context";

type ExistingPlanSummary = {
  id: string;
  rawInput: string;
  refinedGoal: string | null;
  stage: string;
  completedTasks: number;
  totalTasks: number;
};

type NovoPlanoFormProps = {
  userName?: string | null;
  existingPlans?: ExistingPlanSummary[];
  personalization?: PlanCreationPrompts | null;
};

const GOAL_SUGGESTIONS = [
  "Falar inglês com confiança no trabalho e em viagens",
  "Aprender Python e IA para automatizar tarefas do dia a dia",
  "Organizar minhas finanças e começar a investir",
  "Correr meus primeiros 5 km com constância",
];

export function NovoPlanoForm({
  userName,
  existingPlans = [],
  personalization = null,
}: NovoPlanoFormProps) {
  const [goal, setGoal] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [state, formAction, isPending] = useActionState(createPlanAction, {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const firstName = userName?.trim().split(" ")[0] || null;
  const MAX_TEXTAREA_HEIGHT = 224;
  const errorMessage = clientError ?? state.error ?? null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY =
      el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [goal]);

  const submitGoal = () => {
    setClientError(null);

    const trimmedGoal = goal.trim();
    if (!trimmedGoal || trimmedGoal.length < 3) {
      setClientError("Conte um pouco mais sobre o que você quer aprender");
      return;
    }

    const formData = new FormData();
    formData.set("goal", trimmedGoal);

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitGoal();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitGoal();
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setClientError(null);
    setGoal(suggestion);
    textareaRef.current?.focus();
  };

  if (isPending) {
    return (
      <div className="my-auto py-12 w-full max-w-[620px] mx-auto flex flex-col items-center justify-center">
        <BeeLoader
          size="lg"
          label="Analisando seu objetivo"
          sublabel="Estou preparando as primeiras perguntas para desenhar seu plano"
        />
      </div>
    );
  }

  return (
    <div className="mt-2 sm:my-auto py-2 sm:py-8 w-full max-w-[620px] mx-auto">
      <div className="flex flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-1 sm:-ml-3 mb-2 sm:mb-0">
        <MascotBee
          pose="curious"
          glasses
          lookAtUser
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 -mb-2 sm:mb-0"
        />
        <p className="font-display text-xl sm:text-2xl sm:mb-0 mb-4 text-[#2D3142] max-w-[60ch]">
          {personalization?.greeting ? (
            <>
              {firstName ? `${firstName}, ` : ""}
              {personalization.greeting}
            </>
          ) : (
            <>
              {firstName ? `${firstName}, qual` : "Qual"} é o próximo{" "}
              <span className="font-bold">objetivo que você quer alcançar</span>?
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="relative">
          <div className="rounded-2xl bg-[#FFFFFF] border-2 border-[#F3EFE6] focus-within:border-[#5B8DEF] transition-colors p-4 sm:p-5 space-y-4">
            <label htmlFor="goal-input" className="sr-only">
              Descreva o que você quer aprender
            </label>
            <textarea
              id="goal-input"
              ref={textareaRef}
              name="goal"
              rows={3}
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                if (clientError) setClientError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Quero aprender Claude Code para construir e publicar uma CLI de automação..."
              autoFocus
              className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none glint-scrollbar"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="submit"
                className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Começar novo plano</span>
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  aria-expanded={showSuggestions}
                  aria-label="Sugestões de objetivo"
                  title="Sugestões"
                  className={`inline-flex items-center justify-center rounded-xl p-2 transition-colors cursor-pointer ${showSuggestions
                      ? "bg-[#F3EFE6]/60 text-[#2D3142]"
                      : "text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6]/60"
                    }`}
                >
                  <Sparkles className="size-4 text-[#FF9B85]" />
                </button>

                {existingPlans.length > 0 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPlans((prev) => !prev)}
                      aria-expanded={showPlans}
                      aria-label={`Seus planos (${existingPlans.length})`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 font-sans text-xs font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6]/60 transition-colors cursor-pointer"
                    >
                      <Layers className="size-4 sm:size-3.5 text-[#5B8DEF]" />
                      <span className="hidden sm:inline">
                        Seus planos ({existingPlans.length})
                      </span>
                      <ChevronDown
                        className={`hidden sm:block size-3.5 transition-transform ${showPlans ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {showPlans ? (
                      <div
                        role="region"
                        aria-label="Seus planos existentes"
                        className="absolute right-0 bottom-full mb-2 w-72 sm:w-80 z-20 rounded-2xl bg-[#FFFFFF] border border-[#F3EFE6] shadow-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="font-sans text-[11px] font-semibold text-[#646B82]">
                            Seus planos ({existingPlans.length})
                          </span>
                          <Link
                            href="/planos"
                            className="font-sans text-[11px] font-medium text-[#5B8DEF] hover:underline cursor-pointer"
                          >
                            Ver todos
                          </Link>
                        </div>

                        <ul className="space-y-1.5 max-h-56 overflow-y-auto glint-scrollbar">
                          {existingPlans.map((plan) => {
                            const href =
                              plan.stage === "ACTIVE" ||
                                plan.stage === "ENRICHING_TASKS"
                                ? `/planos/${plan.id}`
                                : `/criacao-plano/${plan.id}`;
                            const title =
                              plan.refinedGoal?.trim() || plan.rawInput;
                            return (
                              <li key={plan.id}>
                                <Link
                                  href={href}
                                  className="flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 hover:bg-[#F3EFE6]/60 transition-colors cursor-pointer"
                                >
                                  <span className="font-sans text-xs font-medium text-[#2D3142] truncate">
                                    {title}
                                  </span>
                                  <span className="font-sans text-[11px] text-[#646B82] shrink-0 tabular-nums">
                                    {plan.totalTasks > 0
                                      ? `${plan.completedTasks}/${plan.totalTasks}`
                                      : "Em criação"}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p role="alert" className="font-sans text-xs font-medium text-[#c0564b]">
            {errorMessage}
          </p>
        ) : null}

        {showSuggestions ? (
          <div className="space-y-2">
            <p className="font-sans text-[11px] font-medium text-[#646B82] px-1">
              Sugestões
            </p>
            <div className="flex flex-col gap-1.5">
              {(personalization?.suggestions?.length
                ? personalization.suggestions
                : GOAL_SUGGESTIONS
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="group flex items-center justify-between gap-2.5 rounded-xl bg-[#F3EFE6]/45 hover:bg-[#E8F0FE]/70 px-3.5 py-2.5 font-sans text-xs text-[#2D3142]/80 hover:text-[#2D3142] transition-colors cursor-pointer text-left leading-snug"
                >
                  <span>{suggestion}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-[#5B8DEF] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
