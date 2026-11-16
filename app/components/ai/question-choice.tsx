"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { ArrowRight, Check } from "@gravity-ui/icons";
import type { QuestionAnswer, QuestionOption } from "./types";

interface QuestionChoiceProps {
  mode: "single_choice" | "multi_choice";
  options: QuestionOption[];
  allowCustom?: boolean;
  isSubmitting?: boolean;
  onOptionSelect?: () => void;
  onSubmit: (answer: QuestionAnswer) => void;
}

export function QuestionChoice({
  mode,
  options,
  allowCustom = false,
  isSubmitting = false,
  onOptionSelect,
  onSubmit,
}: QuestionChoiceProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isSingle = mode === "single_choice";

  const toggleOption = (id: string) => {
    setError(null);
    onOptionSelect?.();
    if (isSingle) {
      setUseCustom(false);
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleCustom = () => {
    setError(null);
    onOptionSelect?.();
    if (isSingle) {
      setSelectedIds([]);
      setUseCustom(true);
      return;
    }
    setUseCustom((prev) => !prev);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedCustom = customText.trim();

    if (isSingle) {
      if (useCustom) {
        if (trimmedCustom.length < 2) {
          setError("Escreva sua opção personalizada");
          return;
        }
        onSubmit({
          inputType: "single_choice",
          value: "custom",
          customText: trimmedCustom,
        });
        return;
      }

      if (selectedIds.length === 0) {
        setError("Selecione uma opção para continuar");
        return;
      }
      onSubmit({ inputType: "single_choice", value: selectedIds[0] });
      return;
    }

    if (selectedIds.length === 0 && (!useCustom || trimmedCustom.length < 2)) {
      setError("Selecione ao menos uma opção");
      return;
    }

    onSubmit({
      inputType: "multi_choice",
      values: selectedIds,
      ...(useCustom && trimmedCustom ? { customText: trimmedCustom } : {}),
    });
  };

  const canSubmit = isSingle
    ? selectedIds.length === 1 || (useCustom && customText.trim().length >= 2)
    : selectedIds.length > 0 || (useCustom && customText.trim().length >= 2);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => toggleOption(option.id)}
              aria-pressed={isSelected}
              className={`w-full rounded-2xl border p-4 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                isSelected
                  ? "bg-[#E8F0FE] border-[#5B8DEF] text-[#2D3142]"
                  : "bg-[#FFFFFF] border-[#2D3142]/10 text-[#2D3142] hover:border-[#5B8DEF]/50 hover:bg-[#FFFDF8]"
              }`}
            >
              <div className="space-y-1">
                <p className="font-sans text-sm font-semibold leading-snug">
                  {option.label}
                </p>
                {option.description && (
                  <p className="font-sans text-xs leading-relaxed text-[#646B82]">
                    {option.description}
                  </p>
                )}
              </div>

              <span
                aria-hidden="true"
                className={`mt-0.5 size-5 shrink-0 flex items-center justify-center border transition-colors ${
                  isSingle ? "rounded-full" : "rounded-md"
                } ${
                  isSelected
                    ? "bg-[#5B8DEF] border-[#5B8DEF] text-[#FFFFFF]"
                    : "bg-[#FFFDF8] border-[#2D3142]/20"
                }`}
              >
                {isSelected && <Check className="size-3.5" />}
              </span>
            </button>
          );
        })}

        {allowCustom && (
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              useCustom
                ? "bg-[#E8F0FE]/60 border-[#5B8DEF]"
                : "bg-[#FFFFFF] border-[#2D3142]/10"
            }`}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={toggleCustom}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span className="font-sans text-sm font-semibold text-[#2D3142]">
                Outro motivo ou contexto
              </span>
              <span
                aria-hidden="true"
                className={`size-5 shrink-0 flex items-center justify-center border transition-colors ${
                  isSingle ? "rounded-full" : "rounded-md"
                } ${
                  useCustom
                    ? "bg-[#5B8DEF] border-[#5B8DEF] text-[#FFFFFF]"
                    : "bg-[#FFFDF8] border-[#2D3142]/20"
                }`}
              >
                {useCustom && <Check className="size-3.5" />}
              </span>
            </button>

            {useCustom && (
              <input
                type="text"
                value={customText}
                disabled={isSubmitting}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Descreva rapidamente..."
                autoFocus
                className="mt-3 w-full rounded-xl bg-[#FFFFFF] border border-[#2D3142]/10 px-3.5 py-2.5 font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none focus:border-[#5B8DEF]"
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="font-sans text-xs text-[#646B82]">
          {isSingle ? "Escolha uma opção" : "Selecione uma ou mais opções"}
        </span>

        <Button
          type="submit"
          isDisabled={isSubmitting || !canSubmit}
          className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] disabled:opacity-50 font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>{isSubmitting ? "Enviando..." : "Continuar"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
