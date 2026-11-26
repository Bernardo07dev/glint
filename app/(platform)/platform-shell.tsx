"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Layers, Person } from "@gravity-ui/icons";
import type { ReactNode } from "react";

interface PlatformShellProps {
  userName: string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/home", label: "Início", icon: House },
  { href: "/planos", label: "Planos", icon: Layers },
  { href: "/conta", label: "Conta", icon: Person },
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PlatformShell({ userName, children }: PlatformShellProps) {
  const pathname = usePathname();
  const initials = getInitials(userName);

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2D3142] flex flex-col">
      {/* Top Navbar (Desktop >= md) */}
      <header className="hidden md:block sticky top-0 z-30 bg-[#FFFDF8]/95 backdrop-blur border-b border-[#F3EFE6]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-lg cursor-pointer"
              aria-label="Glint — Ir para o início"
            >
              <img src="/logo.svg" alt="Glint" className="h-9 w-auto" />
            </Link>

            <nav aria-label="Navegação principal" className="flex items-center gap-1">
              {NAV_ITEMS.filter((item) => item.href !== "/conta").map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-[#E8F0FE] text-[#5B8DEF]"
                        : "text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6]/70"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            href="/conta"
            className="inline-flex items-center justify-center rounded-full p-1 bg-[#F3EFE6]/70 hover:bg-[#F3EFE6] transition-colors cursor-pointer"
            title={userName}
            aria-label={`Conta de ${userName}`}
          >
            <span className="size-8 rounded-full bg-[#5B8DEF] text-white text-xs font-semibold flex items-center justify-center">
              {initials}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pb-24 md:pb-12">{children}</main>

      {/* Bottom Tab Bar (Mobile < md) */}
      <nav
        aria-label="Navegação mobile"
        className="md:hidden  py-2 fixed bottom-0 inset-x-0 z-30 bg-[#FFFDF8]/95 backdrop-blur border-t border-[#F3EFE6] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto px-3 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full transition-colors ${
                    item.href === "/conta"
                      ? "p-0.5"
                      : active
                        ? "bg-[#E8F0FE] text-[#5B8DEF] px-2 py-2"
                        : "text-[#646B82] px-2 py-2"
                  }`}
                >
                  {item.href === "/conta" ? (
                    <span
                      className={`size-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                        active
                          ? "bg-[#5B8DEF] text-white ring-2 ring-[#E8F0FE]"
                          : "bg-[#5B8DEF]/85 text-white"
                      }`}
                    >
                      {initials}
                    </span>
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    active ? "text-[#5B8DEF]" : "text-[#646B82]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
