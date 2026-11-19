"use client";

import { useState, useTransition } from "react";
import { Xmark, Calendar } from "@gravity-ui/icons";
import { rescheduleTodayAction } from "@/app/actions/session";

interface RescheduleModalProps {
  open: boolean;
  planId: string;
  taskId: string;
  taskTitle: string;
  nextSlotLabel: string;
  onClose: () => void;
}

export function RescheduleModal({
  open,
  planId,
  taskId,
  taskTitle,
  nextSlotLabel,
  onClose,
}: RescheduleModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await rescheduleTodayAction({ planId, taskId });
      if (!res.success) {
        setError(res.error ?? "Não foi possível reagendar agora.");
        return;
      }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2D3142]/40 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#FFFDF8] p-6 space-y-5 border border-[#F3EFE6]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-2xl bg-[#E8F0FE] text-[#5B8DEF] flex items-center justify-center">
              <Calendar className="size-4" />
            </span>
            <h2
              id="reschedule-title"
              className="font-display text-xl font-medium text-[#2D3142]"
            >
              Imprevisto hoje?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl p-1.5 text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] cursor-pointer"
          >
            <Xmark className="size-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm text-[#646B82] leading-relaxed">
          <p>
            Sem culpa — sua rotina vem primeiro. Vamos mover{" "}
            <strong className="font-semibold text-[#2D3142]">{taskTitle}</strong>{" "}
            para o próximo horário livre do seu plano:
          </p>
          <p className="rounded-2xl bg-[#F3EFE6] px-4 py-3 text-[#2D3142] font-medium">
            Mover esta sessão de hoje para{" "}
            <span className="text-[#5B8DEF]">{nextSlotLabel}</span> e ajustar as
            próximas datas do plano.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-2xl px-4 py-2.5 text-sm font-medium text-[#646B82] hover:bg-[#F3EFE6] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-2xl bg-[#5B8DEF] hover:bg-[#4b7de0] text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPending ? "Reagendando..." : "Confirmar novo horário"}
          </button>
        </div>
      </div>
    </div>
  );
}
