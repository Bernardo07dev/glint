import { AnimatedLogo } from "../components/animated-logo";
import { MascotBee } from "../components/mascot-bee";
import { registerAction } from "../actions/auth";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FFFDF8] font-sans text-[#2D3142]">
      {/* Coluna Esquerda: Cadastro passo a passo */}
      <section className="lg:col-span-5 flex flex-col justify-between px-6 py-6 sm:px-8 lg:border-r border-[#F3EFE6]">
        <header>
          <AnimatedLogo className="h-11 w-auto" />
        </header>

        <CadastroForm action={registerAction} />
      </section>

      {/* Coluna Direita: Ponto Focal Único (oculta no celular) */}
      <aside className="hidden lg:flex lg:col-span-7 bg-[#F3EFE6] px-6 py-10 sm:px-12 lg:px-16 items-center justify-center">
        <div className="w-full max-w-[460px] rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] p-8 space-y-5">
          <div className="flex items-center gap-4">
            <MascotBee pose="curious" className="w-16 h-16 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-medium text-[#2D3142]">
                Seu mentor pessoal de estudos
              </h2>
              <p className="mt-1 font-sans text-sm text-[#646B82]">
                Primeiro entendemos seu objetivo e sua rotina. Depois montamos o
                plano ideal.
              </p>
            </div>
          </div>

          <ul className="space-y-3 pt-2 border-t border-[#F3EFE6] font-sans text-sm text-[#2D3142]">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 size-2 rounded-full bg-[#5B8DEF] shrink-0" />
              <span>Entrevista inicial para alinhar objetivo e nível atual</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 size-2 rounded-full bg-[#FF9B85] shrink-0" />
              <span>Plano de várias semanas encaixado nos seus horários livres</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 size-2 rounded-full bg-[#95E1B0] shrink-0" />
              <span>Sessões práticas diárias com acompanhamento contínuo</span>
            </li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
