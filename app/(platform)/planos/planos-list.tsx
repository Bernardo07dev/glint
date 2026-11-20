"use client";

import Link from "next/link";
import { Plus, ChevronRight, CircleCheck } from "@gravity-ui/icons";
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
      <h2 className="text-xs font-semibold text-[#646B82] tracking-wide">
        {title}
      </h2>

      <div className="divide-y divide-[#F3EFE6] rounded-3xl bg-white border border-[#F3EFE6] overflow-hidden">
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 sm:px-6 hover:bg-[#FFFDF8] transition-colors cursor-pointer"
            >
              <div className="space-y-2 min-w-0 flex-1">
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

                <h3 className="font-display text-base sm:text-[17px] font-medium text-[#2D3142] leading-snug">
                  {item.title}
                </h3>

                {!isCreating && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#646B82]">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="h-1.5 w-24 rounded-full bg-[#F3EFE6] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCompleted ? "bg-[#95E1B0]" : "bg-[#5B8DEF]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="tabular-nums">
                        {item.completedTasks}/{item.totalTasks}
                      </span>
                    </div>

                    {item.nextDateLabel && !isCompleted && (
                      <span className="tabular-nums">
                        Próxima: {item.nextDateLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isCreating ? (
                  <span className="rounded-xl bg-[#E8F0FE] text-[#5B8DEF] px-3.5 py-2 text-xs font-semibold">
                    Continuar entrevista
                  </span>
                ) : (
                  <ChevronRight className="size-5 text-[#646B82]" />
                )}
              </div>
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
        <h1 className="font-display text-3xl font-medium text-[#2D3142]">
          Planos
        </h1>
        <Link
          href="/primeiro-plano"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-4 py-2.5 transition-colors cursor-pointer"
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
