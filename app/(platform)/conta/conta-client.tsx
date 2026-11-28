"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  ArrowRightFromSquare,
  Calendar,
  ChevronRight,
  CircleCheck,
  Sparkles,
} from "@gravity-ui/icons";
import { logoutAction } from "@/app/actions/auth";
import {
  updateProfileAction,
  type UpdateProfileState,
} from "@/app/actions/account";
import { DAY_NAME_PT, type RoutineSlot } from "@/lib/plan/plan-structure";

export interface PlanRoutineSummary {
  planId: string;
  planTitle: string;
  weeklyHours: number;
  slots: RoutineSlot[];
}

interface ContaClientProps {
  user: {
    name: string;
    email: string;
    plan: "FREE" | "PRO";
    planExpiresAt: string | null;
    timezone: string;
  };
  routines: PlanRoutineSummary[];
}

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
  { value: "America/Manaus", label: "Manaus (America/Manaus)" },
  { value: "America/Recife", label: "Recife (America/Recife)" },
  { value: "America/Rio_Branco", label: "Rio Branco (America/Rio_Branco)" },
  { value: "Europe/Lisbon", label: "Lisboa (Europe/Lisbon)" },
  { value: "America/New_York", label: "Nova York (America/New_York)" },
  { value: "UTC", label: "UTC" },
];

const INITIAL_STATE: UpdateProfileState = {};

function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ContaClient({ user, routines }: ContaClientProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    INITIAL_STATE,
  );

  const initials = getInitials(user.name);
  const expiresLabel = user.planExpiresAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
        new Date(user.planExpiresAt),
      )
    : null;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-7">
      <h1 className="font-display text-xl sm:text-2xl font-medium text-[#2D3142]">
        Conta
      </h1>

      {/* 1. Perfil */}
      <form
        action={formAction}
        className="rounded-2xl bg-white border border-[#2D3142]/8 divide-y divide-[#2D3142]/6 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <span className="text-[13px] font-medium text-[#2D3142]">Perfil</span>
          <div className="size-8 rounded-full bg-[#5B8DEF] text-white font-semibold text-xs flex items-center justify-center shrink-0">
            {initials}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <span className="text-[13px] font-medium text-[#2D3142]">E-mail</span>
          <span className="text-[13px] text-[#646B82] truncate">{user.email}</span>
        </div>

        <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-5 py-3 sm:px-6">
          <span className="text-[13px] font-medium text-[#2D3142]">Nome</span>
          <input
            type="text"
            name="name"
            defaultValue={user.name}
            required
            className="w-full sm:w-64 h-8 rounded-xl bg-[#FFFDF8] border border-[#2D3142]/12 focus:border-[#5B8DEF] focus:outline-none px-3 text-xs text-[#2D3142] transition-colors"
          />
        </label>

        <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-5 py-3 sm:px-6">
          <div className="space-y-0.5">
            <span className="block text-[13px] font-medium text-[#2D3142]">
              Fuso horário
            </span>
            <span className="block text-[11px] text-[#646B82]">
              Usado para agendar suas sessões
            </span>
          </div>
          <select
            name="timezone"
            defaultValue={user.timezone || "America/Sao_Paulo"}
            className="w-full sm:w-64 h-8 rounded-xl bg-[#FFFDF8] border border-[#2D3142]/12 focus:border-[#5B8DEF] focus:outline-none px-3 text-xs text-[#2D3142] transition-colors cursor-pointer shrink-0"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="min-h-5 flex items-center">
            {state.error && (
              <p className="text-xs font-medium text-red-600">{state.error}</p>
            )}
            {state.success && !state.error && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2B6E47]">
                <CircleCheck className="size-3.5" />
                <span>Alterações salvas</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[#5B8DEF] hover:bg-[#4b7de0] text-white font-semibold text-xs px-4 py-2 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>

      {/* 2. Assinatura */}
      <section className="space-y-2">
        <h2 className="px-1 text-[1rem] font-medium text-[#2D3142]">Assinatura</h2>
        <div className="rounded-2xl bg-white border border-[#2D3142]/8 px-5 py-3 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="size-3.5 text-[#5B8DEF] shrink-0" />
            <span className="text-[0.8rem] text-[#646B82] font-medium truncate">
              {user.plan === "PRO" && expiresLabel
                ? `Plano PRO ativo até ${expiresLabel}`
                : "Plano gratuito ativo"}
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${
              user.plan === "PRO"
                ? "bg-[#FFE07D] text-[#2D3142]"
                : "bg-[#F3EFE6] text-[#646B82]"
            }`}
          >
            {user.plan === "PRO" ? "PRO" : "Gratuito"}
          </span>
        </div>
      </section>

      {/* 3. Rotina de estudo */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[1rem] font-medium text-[#2D3142]">
            Rotina de estudo
          </h2>
          {routines.length > 0 && (
            <span className="text-[11px] text-[#646B82] tabular-nums">
              {formatMinutes(
                routines.reduce((sum, r) => sum + r.weeklyHours * 60, 0),
              )}
              /sem
            </span>
          )}
        </div>

        {routines.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#2D3142]/8 px-5 py-3 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="size-3.5 text-[#646B82] shrink-0" />
              <p className="text-[13px] text-[#646B82]">
                Seus horários combinados aparecerão aqui quando você ativar um plano.
              </p>
            </div>
            <Link
              href="/planos"
              className="text-xs font-semibold text-[#5B8DEF] hover:underline shrink-0 cursor-pointer"
            >
              Ver planos
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#2D3142]/6 rounded-2xl bg-white border border-[#2D3142]/8 overflow-hidden">
            {routines.map((routine) => {
              const scheduleSummary = routine.slots
                .map((slot) => {
                  const day =
                    DAY_NAME_PT[slot.dayOfWeek.toLowerCase()] ?? slot.dayOfWeek;
                  return `${day}, ${slot.startTime}`;
                })
                .join(" · ");

              return (
                <Link
                  key={routine.planId}
                  href={`/planos/${routine.planId}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 hover:bg-[#FFFDF8] transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[13px] font-medium text-[#2D3142] group-hover:text-[#5B8DEF] transition-colors truncate">
                      {routine.planTitle}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646B82] tabular-nums max-w-full">
                      <Calendar className="size-3.5 text-[#5B8DEF] shrink-0" />
                      <span className="truncate">{scheduleSummary}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-[#F3EFE6] px-2.5 py-0.5 text-[11px] font-medium text-[#2D3142] tabular-nums">
                      {formatMinutes(routine.weeklyHours * 60)}/sem
                    </span>
                    <ChevronRight className="size-3.5 text-[#646B82]/50 group-hover:text-[#5B8DEF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Sessão */}
      <section className="space-y-2">
        <h2 className="px-1 text-[1rem] font-medium text-[#2D3142]">Sessão</h2>
        <div className="rounded-2xl bg-white border border-[#2D3142]/8 px-5 py-3 sm:px-6 flex items-center justify-between gap-4">
          <span className="text-[13px] text-[#646B82]">
            Encerrar sua sessão neste dispositivo
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#646B82] hover:text-[#2D3142] transition-colors cursor-pointer"
            >
              <ArrowRightFromSquare className="size-3.5" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
