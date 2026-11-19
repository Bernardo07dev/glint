"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export interface UpdateProfileState {
  success?: boolean;
  error?: string;
}

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Entre novamente." };
  }

  const name = (formData.get("name") as string)?.trim();
  const timezone = (formData.get("timezone") as string)?.trim() || "America/Sao_Paulo";

  if (!name || name.length < 2) {
    return { success: false, error: "Digite um nome com pelo menos 2 caracteres." };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, timezone },
    });

    const sessionToken = await encrypt({
      userId: updated.id,
      name: updated.name,
      email: updated.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("glint-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    revalidatePath("/conta");
    revalidatePath("/home");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Não foi possível salvar suas alterações agora." };
  }
}
