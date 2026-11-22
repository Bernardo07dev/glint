"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  Plus,
} from "@gravity-ui/icons";
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
}: {
  title: string;
  items: PlanListItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold text-[#646B82] tracking-wide">
        {title}
      </h2>

      <div className="divide-y divide-[#2D3142]/6 rounded-3xl bg-white border border-[#2D3142]/8 overflow-hidden">
        {items.map((item) => {
          const isCreating = IN_CREATION.has(item.stage);
          const isCompleted = item.stage === "COMPLETED";
          const href = isCreating
            ? `/criacao-plano/${item.id}`
            : `/planos/${item.id}`;
          const pct =
            item.totalTasks > 0
              ? Math.round((item.completedTasks / item.totalTasks) * 100)
              : 0;

          return (
            <Link
              key={item.id}
              href={href}
              className={`group flex justify-between px-4 py-4 sm:px-6 sm:py-5 hover:bg-[#FFFDF8] transition-colors cursor-pointer ${
                isCreating
                  ? "flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4"
                  : "items-center gap-3 sm:gap-4"
              }`}
            >
              <div className="space-y-2.5 min-w-0 flex-1">
                {(isCreating || isCompleted) && (
                  <div className="flex flex-wrap items-center gap-2">
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

                <h3 className="font-display text-base sm:text-[17px] font-medium text-[#2D3142] leading-snug">
                  {item.title}
                </h3>

                {!isCreating && (
                  <div className="flex items-center gap-2.5 sm:gap-5 text-xs text-[#646B82] min-w-0">
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
                        <span aria-hidden="true" className="sm:hidden text-[#2D3142]/20 shrink-0">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#646B82] tabular-nums min-w-0">
                          <Calendar
                            className="size-3.5 text-[#5B8DEF] shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            <span className="hidden sm:inline">Próxima: </span>
                            {item.nextDateLabel}
                          </span>
                        </span>
                      </>
                    )}
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
                  className={`size-9 rounded-full border flex items-center justify-center transition-all shrink-0 group-active:scale-95 ${
                    isCompleted
                      ? "bg-[#95E1B0]/25 border-[#95E1B0]/50 text-[#2B6E47] group-hover:bg-[#95E1B0] group-hover:text-[#2D3142]"
                      : "bg-[#E8F0FE] border-[#5B8DEF]/25 text-[#5B8DEF] group-hover:bg-[#5B8DEF] group-hover:text-white group-hover:border-[#5B8DEF]"
                  }`}
                >
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function PlanosList({ items }: PlanosListProps) {
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
              Comece escolhendo um tema e o Glint monta sua jornada semana a semana.
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
          <PlanSection title="Ativos" items={active} />
          <PlanSection title="Em criação" items={creating} />
          <PlanSection title="Concluídos" items={completed} />
        </div>
      )}
    </div>
  );
}
