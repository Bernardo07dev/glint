"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import {
  ArrowRight,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
} from "@gravity-ui/icons";
type LoginFormProps = {
  action: (prevState: any, formData: FormData) => Promise<any>;
  initialUserEmail?: string | null;
};

export function LoginForm({ action, initialUserEmail }: LoginFormProps) {
  const [email, setEmail] = useState(initialUserEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <div className="my-auto py-10 w-full max-w-[384px] mx-auto">
      <h1 className="font-display text-3xl sm:text-[2.2rem] font-medium leading-[1.3] tracking-normal text-[#2D3142]">
        Que bom te ver aqui
      </h1>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#646B82]">
        Sua jornada continua exatamente de onde você parou, no ritmo da sua
        rotina.
      </p>

      <form action={formAction} className="mt-8 space-y-5" noValidate>
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

        {state.error && (
          <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
            {state.error}
          </p>
        )}

        {state.message && (
          <p role="status" className="font-sans text-xs font-medium text-[#5B8DEF]">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          isDisabled={isPending}
          className="mt-2 w-full h-11 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{isPending ? "Entrando..." : "Entrar na minha jornada"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-[#646B82]">
        Ainda não tem uma conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-[#5B8DEF] hover:underline cursor-pointer"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
