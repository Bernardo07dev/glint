"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function registerAction(prevState: any, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name) {
    return { success: false, error: "Digite seu nome para continuar" };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "Digite um e-mail válido" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "A senha precisa ter pelo menos 6 caracteres" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error || !data.user) {
      return { success: false, error: error?.message ?? "Não foi possível criar sua conta" };
    }

    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      update: { name, email },
      create: {
        id: data.user.id,
        name,
        email,
      },
    });

    return { success: true, message: `Conta criada para ${user.name}` };
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return { success: false, error: "Não foi possível criar sua conta agora" };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Preencha seu e-mail e senha" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: "E-mail ou senha incorretos" };
    }

    const user = await prisma.user.update({
      where: { id: data.user.id },
      data: { lastActiveAt: new Date() },
      select: { name: true },
    }).catch(() => null);

    return { success: true, message: `Bem-vindo, ${user?.name ?? data.user.email}` };
  } catch (error: any) {
    console.error("Erro ao autenticar usuário:", error);
    return { success: false, error: "Não foi possível entrar agora" };
  }
}
