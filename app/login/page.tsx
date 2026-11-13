"use client";

import { useState, type FormEvent } from "react";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  Clock,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
} from "@gravity-ui/icons";
import { AnimatedLogo } from "../components/animated-logo";
import { MascotBee } from "../components/mascot-bee";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFeedback("Preencha seu e-mail e senha para continuar.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedback("Autenticação pronta para integração com o backend.");
    }, 900);
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FFFDF8] font-sans text-[#2D3142]">
      {/* Coluna Esquerda: Acesso (~40% da largura, igual à referência) */}
      <section className="lg:col-span-5 flex flex-col justify-between px-6 py-6 sm:px-8 border-b lg:border-b-0 lg:border-r border-[#F3EFE6]">
        <header>
          <AnimatedLogo className="h-11 w-auto" />
        </header>

        <div className="my-auto py-10 w-full max-w-[384px] mx-auto">
          <h1 className="font-display text-3xl sm:text-[2.2rem] font-medium leading-[1.3] tracking-normal text-[#2D3142]">
            Que bom te ver aqui
          </h1>
          <p className="mt-2 font-sans text-sm leading-relaxed text-[#646B82]">
            Sua jornada continua exatamente de onde você parou, no ritmo da sua
            rotina.
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              isRequired
              className="flex flex-col gap-1.5"
            >
              <Label className="font-sans text-sm font-medium text-[#2D3142]">
                E-mail
              </Label>
              <InputGroup className="h-11 rounded-xl bg-[#FFFFFF] border border-[#F3EFE6] focus-within:border-[#5B8DEF] transition-colors px-3 flex items-center gap-2.5">
                <InputGroup.Prefix className="text-[#646B82]">
                  <Envelope className="size-4" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  className="w-full bg-transparent font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
                />
              </InputGroup>
            </TextField>

            <TextField
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              isRequired
              className="flex flex-col gap-1.5"
            >
              <Label className="font-sans text-sm font-medium text-[#2D3142]">
                Senha
              </Label>
              <InputGroup className="h-11 rounded-xl bg-[#FFFFFF] border border-[#F3EFE6] focus-within:border-[#5B8DEF] transition-colors px-3 flex items-center gap-2.5">
                <InputGroup.Prefix className="text-[#646B82]">
                  <Lock className="size-4" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="w-full bg-transparent font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
                />
                <InputGroup.Suffix>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="p-1 text-[#646B82] hover:text-[#2D3142] transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>

            {feedback && (
              <p
                role="status"
                className="font-sans text-xs font-medium text-[#5B8DEF] bg-[#E8F0FE] rounded-lg px-3 py-2"
              >
                {feedback}
              </p>
            )}

            <Button
              type="submit"
              isDisabled={isSubmitting}
              className="mt-2 w-full h-11 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? "Entrando..." : "Entrar na minha jornada"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </section>

      {/* Coluna Direita: Ponto Focal Único (~60% da largura, igual à referência) */}
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
              <h2 className="font-display text-xl font-medium leading-[1.35] tracking-normal text-[#2D3142]">
                Modelando fluxos de dados sem acoplamento
              </h2>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#646B82] max-w-[60ch]">
                Exercício guiado com 2 cenários reais para aplicar antes de
                fechar o dia.
              </p>
            </div>
          </div>

          {/* Nota da Abelhinha Mentora (#FFF0E5 Creme Pêssego) */}
          <div className="rounded-2xl bg-[#FFF0E5] border border-[#FF9B85]/60 p-4 sm:p-5 flex items-center gap-4">
            <div className="shrink-0">
              <MascotBee pose="standard" className="h-16 w-20" />
            </div>
            <p className="font-display italic text-[15px] leading-[1.5] tracking-normal text-[#2D3142] max-w-[42ch]">
              Separei 45 minutos leves para hoje à noite — sem pressa, direto no
              ponto que destrava o próximo passo.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
