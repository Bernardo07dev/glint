import type { ConceptExplainerSource } from "@/lib/tasks/task-content";

export interface FirecrawlScrapedDoc extends ConceptExplainerSource {
  markdown: string;
}

export interface FirecrawlSearchOptions {
  limit?: number;
  timeoutMs?: number;
  maxCharsPerDoc?: number;
}

export function normalizeHttpUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getHostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Referência";
  }
}

export async function searchWebWithFirecrawlV2(
  query: string,
  options?: FirecrawlSearchOptions,
): Promise<FirecrawlScrapedDoc[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("[firecrawl] FIRECRAWL_API_KEY ausente; usando fallback sem busca web.");
    return [];
  }

  const limit = options?.limit ?? 3;
  const timeoutMs = options?.timeoutMs ?? 25000;
  const maxCharsPerDoc = options?.maxCharsPerDoc ?? 10000;

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        sources: [{ type: "web" }],
        limit,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `[firecrawl] /v2/search retornou ${res.status}: ${errText.slice(0, 200)}`,
      );
      return [];
    }

    const json = (await res.json()) as {
      data?: { web?: unknown[] } | unknown[];
    };

    const rawItems = Array.isArray((json.data as { web?: unknown[] } | undefined)?.web)
      ? (json.data as { web: unknown[] }).web
      : Array.isArray(json.data)
        ? json.data
        : [];

    const docs: FirecrawlScrapedDoc[] = [];
    for (const item of rawItems) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const validUrl = normalizeHttpUrl(record.url);
      if (!validUrl) continue;

      const rawTitle =
        typeof record.title === "string" && record.title.trim().length > 0
          ? record.title.trim()
          : getHostnameLabel(validUrl);
      const rawMarkdown =
        typeof record.markdown === "string" && record.markdown.trim().length > 0
          ? record.markdown.trim()
          : typeof record.description === "string"
            ? record.description.trim()
            : "";

      if (!rawMarkdown) continue;

      docs.push({
        title: rawTitle,
        url: validUrl,
        markdown: rawMarkdown.slice(0, maxCharsPerDoc),
      });
    }

    return docs;
  } catch (error) {
    console.warn("[firecrawl] Falha ao consultar Firecrawl v2:", error);
    return [];
  }
}
