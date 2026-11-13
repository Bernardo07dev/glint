import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glint — Seu mentor pessoal de aprendizado",
  description:
    "Transforme qualquer tema em uma jornada estruturada de várias semanas, organizada no seu calendário e moldada à sua rotina real.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-[#FFFDF8] font-sans text-[#2D3142] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
