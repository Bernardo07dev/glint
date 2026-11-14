"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/auth";

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Já existe uma conta com este e-mail" };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const sessionToken = await encrypt({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("glint-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true, message: `Conta criada para ${newUser.name}` };
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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "E-mail ou senha incorretos" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { success: false, error: "E-mail ou senha incorretos" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const sessionToken = await encrypt({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("glint-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true, message: `Bem-vindo, ${user.name}` };
  } catch (error: any) {
    console.error("Erro ao autenticar usuário:", error);
    return { success: false, error: "Não foi possível entrar agora" };
  }
}
