"use client";

import { useActionState } from "react";
import {
  ArrowRightFromSquare,
  Calendar,
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
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-6 sm:pt-9 space-y-6">
      <h1 className="font-display text-3xl font-medium text-[#2D3142]">
        Conta
      </h1>

      {/* 1. Perfil */}
      <section className="rounded-3xl bg-white border border-[#F3EFE6] p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-[#5B8DEF] text-white font-semibold text-base flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-medium text-[#2D3142]">
              Perfil
            </h2>
            <p className="text-xs text-[#646B82] truncate">{user.email}</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#646B82]">Nome</span>
              <input
                type="text"
                name="name"
                defaultValue={user.name}
                required
                className="w-full rounded-xl bg-[#FFFDF8] border border-[#F3EFE6] focus:border-[#5B8DEF] focus:outline-none px-3.5 py-2.5 text-sm text-[#2D3142]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#646B82]">E-mail</span>
              <input
                type="email"
                value={user.email}
                readOnly
                disabled
                className="w-full rounded-xl bg-[#F3EFE6]/60 border border-[#F3EFE6] px-3.5 py-2.5 text-sm text-[#646B82] cursor-not-allowed"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#646B82]">
              Fuso horário
            </span>
            <select
              name="timezone"
              defaultValue={user.timezone || "America/Sao_Paulo"}
              className="w-full rounded-xl bg-[#FFFDF8] border border-[#F3EFE6] focus:border-[#5B8DEF] focus:outline-none px-3.5 py-2.5 text-sm text-[#2D3142] cursor-pointer"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>

          {state.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2B6E47]">
              <CircleCheck className="size-4" />
              <span>Alterações salvas</span>
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-[#5B8DEF] hover:bg-[#4b7de0] text-white font-semibold text-sm px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Assinatura */}
      <section className="rounded-3xl bg-[#F3EFE6]/70 border border-[#F3EFE6] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#5B8DEF]" />
            <h2 className="font-display text-lg font-medium text-[#2D3142]">
              Assinatura
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                user.plan === "PRO"
                  ? "bg-[#FFE07D] text-[#2D3142]"
                  : "bg-white text-[#646B82]"
              }`}
            >
              {user.plan}
            </span>
          </div>
          <p className="text-xs text-[#646B82]">
            {user.plan === "PRO" && expiresLabel
              ? `Plano PRO ativo até ${expiresLabel}.`
              : "Você está usando o plano gratuito do Glint."}
          </p>
        </div>
      </section>

      {/* 3. Sua Rotina & Estudo */}
      <section className="rounded-3xl bg-white border border-[#F3EFE6] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-[#5B8DEF]" />
          <h2 className="font-display text-lg font-medium text-[#2D3142]">
            Sua rotina & estudo
          </h2>
        </div>

        {routines.length === 0 ? (
          <p className="text-sm text-[#646B82]">
            Assim que você ativar um plano, seus horários de estudo combinados com o Glint aparecerão aqui.
          </p>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <div
                key={routine.planId}
                className="rounded-2xl bg-[#FFFDF8] border border-[#F3EFE6] p-4 space-y-2.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[#2D3142] truncate">
                    {routine.planTitle}
                  </p>
                  <span className="text-xs text-[#646B82] tabular-nums shrink-0">
                    {routine.weeklyHours}h/semana
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {routine.slots.map((slot, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-[#E8F0FE]/70 text-[#2D3142] px-3 py-1 text-xs font-medium tabular-nums"
                    >
                      {DAY_NAME_PT[slot.dayOfWeek.toLowerCase()] ?? slot.dayOfWeek}{" "}
                      · {slot.startTime} ({slot.maxMinutes} min)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Sessão */}
      <section className="pt-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#F3EFE6] bg-white hover:bg-[#FFF0E5]/60 text-sm font-medium text-[#646B82] hover:text-[#2D3142] px-5 py-3 transition-colors cursor-pointer"
          >
            <ArrowRightFromSquare className="size-4" />
            <span>Sair da conta</span>
          </button>
        </form>
      </section>
    </div>
  );
}
