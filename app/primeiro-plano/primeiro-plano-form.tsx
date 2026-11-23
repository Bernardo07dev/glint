"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@heroui/react";
import { ArrowRight } from "@gravity-ui/icons";
import { createPlanAction } from "../actions/plan";
import { MascotBee } from "../components/mascot-bee";
import { BeeLoader } from "../components/bee-loader";

type PrimeiroPlanoFormProps = {
  userName?: string | null;
};

const GOAL_SUGGESTIONS = [
  "Falar inglês com confiança no trabalho e em viagens",
  "Aprender Python e IA para automatizar tarefas do dia a dia",
  "Organizar minhas finanças e começar a investir",
  "Correr meus primeiros 5 km com constância",
];

export function PrimeiroPlanoForm({ userName }: PrimeiroPlanoFormProps) {
  const [goal, setGoal] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowTip(true), 120);
    return () => clearTimeout(id);
  }, []);
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
      {/* Presença do Mentor + Saudação Contextual */}
      <div className="flex flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-1 sm:-ml-3 mb-2 sm:mb-0">
        <MascotBee
          pose="curious"
          glasses
          lookAtUser
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 -mb-2 sm:mb-0"
        />
        <p className="font-display text-xl sm:text-2xl sm:mb-0 mb-4  text-[#2D3142] max-w-[60ch]">
          {firstName ? `${firstName}, antes` : "Antes"} de montar seu
          plano, <span className="font-bold"> me diga onde você quer chegar </span>
        </p>
      </div>

      {/* Ponto Focal Único: Composer do Objetivo */}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="submit"
                className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Começar meu plano</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <aside
            className={`hidden lg:block lg:absolute lg:left-full lg:top-4 lg:ml-4 w-72 rounded-2xl bg-[#FFFFFF] border-2 border-[#5B8DEF] p-3.5 text-[#5B8DEF] origin-left transition-all duration-300 ease-out ${
              showTip
                ? "opacity-100 scale-100 translate-x-0"
                : "opacity-0 scale-95 -translate-x-2"
            }`}
          >
            <span
              aria-hidden="true"
              className="hidden lg:block absolute -left-[7px] top-5 size-3 rotate-45 bg-[#FFFFFF] border-l-2 border-b-2 border-[#5B8DEF]"
            />
            <p className="font-sans text-xs font-semibold leading-relaxed text-[#5B8DEF]">
              Escreva com suas palavras, mesmo que o objetivo ainda pareça amplo.
            </p>
          </aside>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="font-sans text-xs font-medium text-[#C85A54]"
          >
            {errorMessage}
          </p>
        )}

        {/* Sugestões rápidas clicáveis */}
        <div className="space-y-2.5 opacity-45 hover:opacity-100 transition-opacity">
          <p className="font-sans text-xs pb-2 font-medium text-[#646B82]">
            Ou escolha um exemplo para adaptar
          </p>
          <div className="flex flex-wrap gap-2">
            {GOAL_SUGGESTIONS.map((suggestion) => {
              const isSelected = goal === suggestion;
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`rounded-xl px-3.5 py-2 font-sans text-xs font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#E8F0FE] text-[#5B8DEF] border border-[#5B8DEF]/30"
                      : "bg-[#F3EFE6]/60 text-[#646B82] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                  }`}
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
