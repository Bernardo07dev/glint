import type { Metadata } from "next";
import { PreviewAiClient } from "./preview-ai-client";

export const metadata: Metadata = {
  title: "Preview — Tools de Sessão | Glint",
};

export default function PreviewAiPage() {
  return <PreviewAiClient />;
}
