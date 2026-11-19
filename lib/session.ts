import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: "FREE" | "PRO";
  planExpiresAt: Date | null;
  timezone: string;
  avatarUrl: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("glint-session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const payload = await decrypt(sessionCookie);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        planExpiresAt: true,
        timezone: true,
        avatarUrl: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
