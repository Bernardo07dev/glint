import { Suspense } from "react";
import { Calendar, Clock } from "@gravity-ui/icons";
import { AnimatedLogo } from "../components/animated-logo";
import { MascotBee } from "../components/mascot-bee";
import { createClient } from "@/lib/supabase/server";
import { loginAction } from "../actions/auth";
import { LoginForm } from "./login-form";

async function LoginContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LoginForm action={loginAction} initialUserEmail={user?.email} />;
}

export default function LoginPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FFFDF8] font-sans text-[#2D3142]">
      {/* Coluna Esquerda: Acesso (~40% da largura) */}
      <section className="lg:col-span-5 flex flex-col justify-between px-6 py-6 sm:px-8 border-b lg:border-b-0 lg:border-r border-[#F3EFE6]">
        <header>
          <AnimatedLogo className="h-11 w-auto" />
        </header>

        <Suspense fallback={<LoginForm action={loginAction} />}>
          <LoginContent />
        </Suspense>
      </section>

      {/* Coluna Direita: Ponto Focal Único (~60% da largura) */}
      <aside className="lg:col-span-7 bg-[#F3EFE6] px-6 py-10 sm:px-12 lg:px-16 flex items-center justify-center">
        <div className="w-full max-w-[460px] space-y-5">
          {/* Cabeçalho contextual da jornada */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-sans text-xs font-medium text-[#646B82]">
              <span className="inline-flex items-center gap-1.5 text-[#2D3142]">
                <Calendar className="size-4 text-[#5B8DEF]" />
                Semana 3 de 6 · Fundamentos de Arquitetura
              </span>
              <span className="tabular-nums text-[#5B8DEF] font-semibold">
                50%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#FFFDF8] overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-[#5B8DEF]" />
            </div>
          </div>

          {/* Bloco ativo de hoje (#FFFFFF com borda Cobalto Pastel #5B8DEF) */}
          <div className="rounded-2xl bg-[#FFFFFF] border-2 border-[#5B8DEF] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] px-2.5 py-1 font-sans text-xs font-semibold text-[#5B8DEF]">
                Sessão de hoje
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE07D] px-2.5 py-1 font-sans text-xs font-semibold tabular-nums text-[#2D3142]">
                <Clock className="size-3.5" />
                19:30 – 20:15
              </span>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-[#2D3142]">
                Modelagem de Dados na Prática
              </h2>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#646B82]">
                Hoje você vai estruturar o relacionamento entre usuários,
                planos de estudo e blocos de calendário.
              </p>
            </div>

            <div className="rounded-xl bg-[#FFF0E5] p-3.5 flex items-center gap-3">
              <MascotBee pose="standard" className="w-11 h-11 shrink-0" />
              <p className="font-sans text-xs leading-relaxed text-[#2D3142]">
                Separei 45 minutos no seu melhor horário de foco. Vamos direto
                para o exemplo prático.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
