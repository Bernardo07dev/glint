import type { Metadata } from "next";
import { AnimationsShowcaseClient } from "./animations-showcase-client";

export const metadata: Metadata = {
  title: "Glint · Animações Full-Screen & Loaders Dinâmicos",
  description:
    "Palco Full-Screen (100dvh) com coreografia vetorial da Abelhinha, paleta Aquarela Viva e tipografia editorial Fraunces com frases dinâmicas por seção.",
};

export default function AnimationsPage() {
  return <AnimationsShowcaseClient />;
}
