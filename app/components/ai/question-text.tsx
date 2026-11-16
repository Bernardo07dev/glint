"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@heroui/react";
import { ArrowRight } from "@gravity-ui/icons";
import type { QuestionAnswer } from "./types";

interface QuestionTextProps {
  placeholder?: string;
  isSubmitting?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
}

const MAX_TEXTAREA_HEIGHT = 200;

export function QuestionText({
  placeholder = "Escreva sua resposta aqui...",
  isSubmitting = false,
  onSubmit,
}: QuestionTextProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY =
      el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Escreva uma resposta para continuar");
      return;
    }
    setError(null);
    onSubmit({ inputType: "text", value: trimmed });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#2D3142]/10 p-4 focus-within:border-[#5B8DEF] transition-colors">
        <textarea
          ref={textareaRef}
          rows={3}
          value={value}
          disabled={isSubmitting}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="font-sans text-xs text-[#646B82]">
          Enter para enviar, Shift + Enter para quebrar linha
        </span>

        <Button
          type="submit"
          isDisabled={isSubmitting || value.trim().length < 2}
          className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] disabled:opacity-50 font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>{isSubmitting ? "Enviando..." : "Continuar"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
