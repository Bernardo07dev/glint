"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import {
  ArrowLeft,
  ArrowRight,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
  Person,
} from "@gravity-ui/icons";
type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

type CadastroFormProps = {
  action: (prevState: any, formData: FormData) => Promise<any>;
};

export function CadastroForm({ action }: CadastroFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(action, {});

  const handleBack = () => {
    setClientError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);

    if (step === 1) {
      if (!name.trim()) {
        setClientError("Digite seu nome para continuar");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!email.trim() || !email.includes("@")) {
        setClientError("Digite um e-mail válido");
        return;
      }
      setStep(3);
      return;
    }

    if (password.length < 6) {
      setClientError("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setClientError("As senhas não coincidem");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("password", password);

    startTransition(() => {
      formAction(formData);
    });
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;
  const errorMessage = clientError ?? state.error;

  return (
    <div className="my-auto py-10 w-full max-w-[384px] mx-auto">
      {/* Indicador de progresso */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between font-sans text-xs font-medium text-[#646B82]">
          <span className="tabular-nums">
            Passo {step} de {TOTAL_STEPS}
          </span>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-[#5B8DEF] hover:underline cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Voltar
            </button>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#F3EFE6] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5B8DEF] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl sm:text-[2.2rem] font-medium leading-[1.3] tracking-normal text-[#2D3142]">
                Como podemos te chamar?
              </h1>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#646B82]">
                Vamos começar pelo básico para personalizar sua jornada.
              </p>
            </div>

            <TextField
              name="name"
              type="text"
              value={name}
              onChange={setName}
              isRequired
              className="flex flex-col gap-1.5"
            >
              <Label className="font-sans text-sm font-medium text-[#2D3142]">
                Seu nome
              </Label>
              <InputGroup className="h-11 rounded-xl bg-[#FFFFFF] border border-[#F3EFE6] focus-within:border-[#5B8DEF] transition-colors px-3 flex items-center gap-2.5">
                <InputGroup.Prefix className="text-[#646B82]">
                  <Person className="size-4" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="Ex: Bernardo"
                  autoComplete="name"
                  autoFocus
                  className="w-full bg-transparent font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
                />
              </InputGroup>
            </TextField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl sm:text-[2.2rem] font-medium leading-[1.3] tracking-normal text-[#2D3142]">
                Qual é o seu e-mail, {name.trim().split(" ")[0]}?
              </h1>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#646B82]">
                Usaremos ele para salvar seu progresso e enviar seus avisos.
              </p>
            </div>

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
                  autoFocus
                  className="w-full bg-transparent font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
                />
              </InputGroup>
            </TextField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl sm:text-[2.2rem] font-medium leading-[1.3] tracking-normal text-[#2D3142]">
                Crie uma senha segura
              </h1>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#646B82]">
                Escolha uma senha com pelo menos 6 caracteres para proteger sua
                conta.
              </p>
            </div>

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
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                  autoFocus
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

            <TextField
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
              isRequired
              className="flex flex-col gap-1.5"
            >
              <Label className="font-sans text-sm font-medium text-[#2D3142]">
                Confirmar senha
              </Label>
              <InputGroup className="h-11 rounded-xl bg-[#FFFFFF] border border-[#F3EFE6] focus-within:border-[#5B8DEF] transition-colors px-3 flex items-center gap-2.5">
                <InputGroup.Prefix className="text-[#646B82]">
                  <Lock className="size-4" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  className="w-full bg-transparent font-sans text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:outline-none"
                />
              </InputGroup>
            </TextField>
          </div>
        )}

        {errorMessage && (
          <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
            {errorMessage}
          </p>
        )}

        {state.message && !clientError && (
          <p role="status" className="font-sans text-xs font-medium text-[#5B8DEF]">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          isDisabled={isPending}
          className="w-full h-11 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {step < TOTAL_STEPS
              ? "Continuar"
              : isPending
                ? "Criando conta..."
                : "Criar minha conta"}
          </span>
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-[#646B82]">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-[#5B8DEF] hover:underline cursor-pointer"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
