"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  EllipsisVertical,
  Plus,
  TrashBin,
  Xmark,
} from "@gravity-ui/icons";
import { deletePlanAction } from "@/app/actions/plan";
import { MascotBee } from "@/app/components/mascot-bee";

export interface PlanListItem {
  id: string;
  title: string;
  stage: string;
  stageLabel: string;
  totalTasks: number;
  completedTasks: number;
  nextDateLabel: string | null;
}

interface PlanosListProps {
  items: PlanListItem[];
}

const IN_CREATION = new Set([
  "REFINING_GOAL",
  "INTERVIEWING_STEPS",
  "GENERATING_TASKS",
  "ENRICHING_TASKS",
]);

function PlanSection({
  title,
  items,
  openMenuId,
  onToggleMenu,
  onRequestDelete,
}: {
  title: string;
  items: PlanListItem[];
  openMenuId: string | null;
  onToggleMenu: (planId: string) => void;
  onRequestDelete: (item: PlanListItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold text-[#646B82] tracking-wide">
        {title}
      </h2>

      <div className="divide-y divide-[#2D3142]/6 rounded-3xl bg-white border border-[#2D3142]/8">
        {items.map((item) => {
          const isCreating = IN_CREATION.has(item.stage);
          const isCompleted = item.stage === "COMPLETED";
          const isMenuOpen = openMenuId === item.id;
          const href = isCreating
            ? `/criacao-plano/${item.id}`
            : `/planos/${item.id}`;
          const pct =
            item.totalTasks > 0
              ? Math.round((item.completedTasks / item.totalTasks) * 100)
              : 0;

          return (
            <div
              key={item.id}
              className={`group relative px-4 py-4 sm:px-6 sm:py-5 hover:bg-[#FFFDF8] transition-colors first:rounded-t-3xl last:rounded-b-3xl ${
                isMenuOpen ? "z-20" : ""
              }`}
            >
              <Link
                href={href}
                className={`flex justify-between sm:pr-10 cursor-pointer ${
                  isCreating
                    ? "flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 pr-9 sm:pr-10"
                    : "flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                }`}
              >
                <div className="space-y-2.5 min-w-0 flex-1">
                  {(isCreating || isCompleted) && (
                    <div className="flex flex-wrap items-center gap-2 pr-9 sm:pr-0">
                      {isCreating && (
                        <span className="rounded-full bg-[#FFE07D]/50 text-[#2D3142] px-2.5 py-0.5 text-[11px] font-semibold">
                          {item.stageLabel}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#95E1B0]/30 text-[#2B6E47] px-2.5 py-0.5 text-[11px] font-semibold">
                          <CircleCheck className="size-3.5" />
                          <span>Concluído</span>
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="font-display text-base sm:text-[17px] font-medium text-[#2D3142] leading-snug pr-9 sm:pr-0">
                    {item.title}
                  </h3>

                  {!isCreating && (
                    <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-5 text-xs text-[#646B82] min-w-0">
                      <div className="flex items-center gap-2.5 sm:gap-5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                          <span
                            aria-hidden="true"
                            className="sm:hidden inline-flex size-[18px] rounded-full items-center justify-center shrink-0"
                            style={{
                              background: `conic-gradient(${
                                isCompleted ? "#95E1B0" : "#5B8DEF"
                              } ${pct * 3.6}deg, #E5DFD3 0deg)`,
                            }}
                          >
                            <span className="size-3 rounded-full bg-white" />
                          </span>
                          <div className="hidden sm:block h-1.5 w-24 rounded-full bg-[#F3EFE6] overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? "bg-[#95E1B0]" : "bg-[#5B8DEF]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] sm:text-xs font-semibold text-[#2D3142]/80 tabular-nums shrink-0">
                            {item.completedTasks}/{item.totalTasks}
                            <span className="hidden sm:inline font-medium text-[#646B82]">
                              {" "}
                              sessões
                            </span>
                          </span>
                        </div>

                        {item.nextDateLabel && !isCompleted && (
                          <>
                            <span
                              aria-hidden="true"
                              className="sm:hidden text-[#2D3142]/20 shrink-0"
                            >
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#646B82] tabular-nums min-w-0">
                              <Calendar
                                className="size-3.5 text-[#5B8DEF] shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">
                                <span className="hidden sm:inline">
                                  Próxima:{" "}
                                </span>
                                {item.nextDateLabel}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      <span
                        aria-hidden="true"
                        className={`sm:hidden size-8 rounded-full border flex items-center justify-center transition-all shrink-0 group-active:scale-95 ${
                          isCompleted
                            ? "bg-[#95E1B0]/25 border-[#95E1B0]/50 text-[#2B6E47] group-hover:bg-[#95E1B0] group-hover:text-[#2D3142]"
                            : "bg-[#E8F0FE] border-[#5B8DEF]/25 text-[#5B8DEF] group-hover:bg-[#5B8DEF] group-hover:text-white group-hover:border-[#5B8DEF]"
                        }`}
                      >
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  )}
                </div>

                {isCreating ? (
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E8F0FE] group-hover:bg-[#5B8DEF] text-[#5B8DEF] group-hover:text-white px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 self-start sm:self-center">
                    <span>Continuar entrevista</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className={`hidden sm:flex size-9 rounded-full border items-center justify-center transition-all shrink-0 group-active:scale-95 ${
                      isCompleted
                        ? "bg-[#95E1B0]/25 border-[#95E1B0]/50 text-[#2B6E47] group-hover:bg-[#95E1B0] group-hover:text-[#2D3142]"
                        : "bg-[#E8F0FE] border-[#5B8DEF]/25 text-[#5B8DEF] group-hover:bg-[#5B8DEF] group-hover:text-white group-hover:border-[#5B8DEF]"
                    }`}
                  >
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Link>

              <div
                data-plan-menu={item.id}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3"
              >
                <button
                  type="button"
                  onClick={() => onToggleMenu(item.id)}
                  aria-label={`Opções do plano ${item.title}`}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  className="size-8 rounded-full flex items-center justify-center text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                >
                  <EllipsisVertical className="size-4" />
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 z-30 min-w-[168px] rounded-2xl bg-white border border-[#2D3142]/10 shadow-lg p-1.5"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onRequestDelete(item)}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <TrashBin className="size-3.5 shrink-0" />
                      <span>Excluir plano</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlanosList({ items }: PlanosListProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!openMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const menuRoot = target?.closest("[data-plan-menu]");
      if (menuRoot?.getAttribute("data-plan-menu") !== openMenuId) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  const handleToggleMenu = (planId: string) => {
    setOpenMenuId((prev) => (prev === planId ? null : planId));
  };

  const handleRequestDelete = (item: PlanListItem) => {
    setOpenMenuId(null);
    setDeleteError(null);
    setPlanToDelete(item);
  };

  const handleCloseModal = () => {
    if (isPending) return;
    setDeleteError(null);
    setPlanToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!planToDelete) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deletePlanAction(planToDelete.id);
      if (!res.success) {
        setDeleteError(res.error ?? "Não foi possível excluir o plano agora.");
        return;
      }
      setPlanToDelete(null);
      router.refresh();
    });
  };

  const active = items.filter((i) => i.stage === "ACTIVE");
  const creating = items.filter((i) => IN_CREATION.has(i.stage));
  const completed = items.filter((i) => i.stage === "COMPLETED");

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-9 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#2D3142]">
          Planos
        </h1>
        <Link
          href="/primeiro-plano"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-4 py-2.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="size-4" />
          <span>Novo plano</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-[#F3EFE6]/70 px-6 py-10 text-center space-y-4">
          <MascotBee pose="curious" className="h-24 w-28 mx-auto" />
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-medium text-[#2D3142]">
              Nenhum plano ainda
            </h2>
            <p className="text-sm text-[#646B82] max-w-[46ch] mx-auto">
              Comece escolhendo um tema e o Glint monta sua jornada semana a
              semana.
            </p>
          </div>
          <Link
            href="/primeiro-plano"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-5 py-3 transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Criar primeiro plano</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <PlanSection
            title="Ativos"
            items={active}
            openMenuId={openMenuId}
            onToggleMenu={handleToggleMenu}
            onRequestDelete={handleRequestDelete}
          />
          <PlanSection
            title="Em criação"
            items={creating}
            openMenuId={openMenuId}
            onToggleMenu={handleToggleMenu}
            onRequestDelete={handleRequestDelete}
          />
          <PlanSection
            title="Concluídos"
            items={completed}
            openMenuId={openMenuId}
            onToggleMenu={handleToggleMenu}
            onRequestDelete={handleRequestDelete}
          />
        </div>
      )}

      {planToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2D3142]/40 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-plan-title"
          onClick={handleCloseModal}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#FFFDF8] p-6 sm:p-7 space-y-6 border border-[#F3EFE6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="size-9 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <TrashBin className="size-4" />
                </span>
                <h2
                  id="delete-plan-title"
                  className="font-display text-lg font-medium text-[#2D3142]"
                >
                  Excluir plano?
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                aria-label="Fechar"
                className="rounded-xl p-1.5 text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-60"
              >
                <Xmark className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-[13px] text-[#646B82] leading-[1.65]">
              <p>
                Tem certeza que deseja excluir{" "}
                <strong className="font-semibold text-[#2D3142]">
                  {planToDelete.title}
                </strong>
                ?
              </p>
              <p className="rounded-2xl bg-[#F3EFE6] px-4 py-3 text-[#2D3142] leading-[1.6]">
                Todas as sessões agendadas e o progresso deste plano serão
                removidos permanentemente.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-600">{deleteError}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="rounded-2xl px-4 py-2.5 text-[13px] font-medium text-[#646B82] hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isPending ? "Excluindo..." : "Excluir plano"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
