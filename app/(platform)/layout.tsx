import { Suspense, type ReactNode } from "react";
import { requireSessionUser } from "@/lib/auth/session";
import { BeeLoader } from "@/app/components/bee-loader";
import { PlatformShell } from "./platform-shell";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();
  return <PlatformShell userName={user.name}>{children}</PlatformShell>;
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
          <BeeLoader label="Carregando seu espaço" />
        </div>
      }
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
