"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  ArrowUpRightFromSquare,
  ChevronDown,
  Globe,
  Plus,
  Xmark,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import type { BeeSourceItem, BeeStreamEvent } from "@/app/api/plan/[planId]/tasks/[taskId]/bee/route";
import type { LiveQuizState } from "./recall-quiz";
import type { ToolId } from "./types";

const QUICK_PROMPTS: Record<ToolId, string[]> = {
  video: [
    "Resuma a ideia principal deste vídeo",
    "Me dê um exemplo prático desse trecho",
    "Como executo o próximo item do roteiro?",
  ],
  concept_explainer: [
    "Explique esse conceito de um jeito mais simples",
    "Mostre um exemplo prático a mais",
    "Me ajude no entregável deste passo",
  ],
  active_recall_quiz: [
    "Me dê uma dica sem entregar a resposta",
    "Qual conceito esta questão cobra?",
  ],
};

const THINKING_PHRASES = [
  "Convencendo os neurônios a trabalhar...",
  "Procurando a resposta debaixo do sofá...",
  "Perguntando pro estagiário imaginário...",
  "Fazendo cara de quem entendeu...",
  "Soprando a poeira do cérebro...",
  "Rodando na bateria de um Tamagotchi...",
  "Negociando com o Stack Overflow...",
  "Compilando uma desculpa convincente...",
  "Puxando a alavanca do caça-níquel neural...",
  "Esquentando o café dos transistores...",
  "Dando um git blame nas minhas ideias...",
  "Contando até 3 antes de falar...",
  "Reiniciando o roteador mental...",
  "Cutucando o servidor com um graveto...",
  "Ensaiando a resposta no espelho...",
  "Chamando o Tio Zé da infraestrutura...",
];

export interface BeeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingPhrase?: string;
  sources?: BeeSourceItem[];
  isSearching?: boolean;
}

function SourcesDropdown({ sources }: { sources: BeeSourceItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-medium text-[#646B82] transition-colors hover:text-[#2D3142] cursor-pointer"
      >
        <Globe className="size-3.5 shrink-0" />
        <span>
          Pesquisou na web · {sources.length}{" "}
          {sources.length === 1 ? "fonte" : "fontes"}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-[#2D3142]/8 bg-white/85 divide-y divide-[#2D3142]/6">
          {sources.map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center justify-between gap-2 px-3 py-2 text-[0.65rem] text-[#2D3142]/85 transition-colors hover:bg-[#E8F0FE]/60 hover:text-[#3E6FD6] cursor-pointer"
            >
              <span className="min-w-0 truncate">{src.title}</span>
              <ArrowUpRightFromSquare className="size-3 shrink-0 text-[#646B82]" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

interface BeeHelperPanelProps {
  planId: string;
  taskKey: string;
  stepId: string;
  totalWalkthrough: number;
  toolRef: ToolId;
  checkedWalkthroughIndices: number[];
  quizState?: LiveQuizState;
  messages: BeeMessage[];
  onMessagesChange: Dispatch<SetStateAction<BeeMessage[]>>;
  onClose: () => void;
}

export function BeeHelperPanel({
  planId,
  taskKey,
  stepId,
  totalWalkthrough,
  toolRef,
  checkedWalkthroughIndices,
  quizState,
  messages,
  onMessagesChange,
  onClose,
}: BeeHelperPanelProps) {
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isStreaming) return;

    const userMsg: BeeMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now()}`;
    const thinkingPhrase =
      THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
    const assistantPlaceholder: BeeMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinkingPhrase,
    };

    const historyForApi = [...messages, userMsg]
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    onMessagesChange((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `/api/plan/${encodeURIComponent(planId)}/tasks/${encodeURIComponent(taskKey)}/bee`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForApi,
            liveStepContext: {
              currentStepId: stepId,
              checkedWalkthroughIndices,
              quizState:
                toolRef === "active_recall_quiz" ? quizState : undefined,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed) as BeeStreamEvent;
            if (event.type === "status" && event.status === "searching") {
              onMessagesChange((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isSearching: true } : m,
                ),
              );
            } else if (event.type === "sources") {
              onMessagesChange((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, sources: event.sources, isSearching: false }
                    : m,
                ),
              );
            } else if (event.type === "text-delta") {
              onMessagesChange((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: m.content + event.text,
                        isSearching: false,
                      }
                    : m,
                ),
              );
            } else if (event.type === "error") {
              onMessagesChange((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: m.content || event.message,
                        isSearching: false,
                      }
                    : m,
                ),
              );
            }
          } catch {
            // Ignora linha parcial inválida
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onMessagesChange((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "Não consegui responder agora. Tente novamente em instantes.",
                  isSearching: false,
                }
              : m,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const prompts = QUICK_PROMPTS[toolRef];
  const hasInput = input.trim().length > 0 && !isStreaming;

  return (
    <>
      {/* Backdrop mobile */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#2D3142]/15 transition-opacity duration-200 lg:hidden ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Container saindo de baixo (bottom-0, rounded-t-3xl), cobrindo tudo até o menu superior */}
      <section
        aria-label="Tirar dúvida com a Bee"
        className={`fixed inset-x-0 bottom-0 z-50 flex h-[78dvh] pb-2 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[#2D3142]/10 bg-[linear-gradient(0deg,#FFF0E5_0%,#FFF7EC_24%,#FFFDF8_60%)] shadow-[0_-12px_36px_-10px_rgba(45,49,66,0.16)] transition-transform duration-300 ease-out lg:top-[4.75rem] lg:right-3 lg:left-[calc(50%+23.25rem)] lg:h-auto ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Barra superior: Nova sessão + indicador circular de step à esquerda | Fechar à direita */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-3.5">
          <div className="flex items-center gap-2.5 pb-2">
            <button
              type="button"
              onClick={() => {
                abortControllerRef.current?.abort();
                setIsStreaming(false);
                onMessagesChange([]);
                setInput("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3EFE6] px-2.5 py-1 text-[0.7rem] font-medium text-[#646B82] transition-colors hover:bg-[#EAE4D7] hover:text-[#2D3142] cursor-pointer"
            >
              <Plus className="size-3 shrink-0" />
              <span>Nova sessão</span>
            </button>

            {(() => {
              const completed = checkedWalkthroughIndices.length;
              const pct =
                totalWalkthrough > 0
                  ? Math.round((completed / totalWalkthrough) * 100)
                  : 0;
              const ringColor =
                totalWalkthrough > 0 && completed === totalWalkthrough
                  ? "#95E1B0"
                  : "#5B8DEF";
              return (
                <div
                  className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium tabular-nums text-[#646B82]"
                  title={`${completed} de ${totalWalkthrough} itens concluídos`}
                >
                  <span
                    aria-hidden="true"
                    className="relative flex size-4 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${ringColor} ${pct}%, #E5E0D5 0)`,
                    }}
                  >
                    <span className="size-2.5 rounded-full bg-[#FFFDF8]" />
                  </span>
                  <span>
                    {completed}/{totalWalkthrough}
                  </span>
                </div>
              );
            })()}
          </div>

          <button
            type="button"
            aria-label="Fechar painel da Bee"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-[#646B82] transition-colors hover:bg-[#F3EFE6] hover:text-[#2D3142] cursor-pointer"
          >
            <Xmark className="size-4" />
          </button>
        </div>

        {/* Corpo: Zero-state ou Histórico de Mensagens */}
        <div
          ref={scrollContainerRef}
          className="flex flex-1 flex-col overflow-y-auto px-5 py-2"
        >
          {messages.length === 0 ? (
            <div className="mt-auto flex flex-col gap-3.5">
              <div className="space-y-1.5">
                <MascotBee pose="curious" className="h-14 w-16" />
                <h3 className="font-display text-lg font-medium leading-snug text-[#2D3142]">
                  Ficou alguma dúvida neste passo?
                </h3>
                <p className="text-[13px] leading-relaxed text-[#646B82]">
                  Escolha um atalho ou pergunte abaixo
                </p>
              </div>

              <div className="flex flex-col items-start gap-1.5">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full bg-[#ffffff]/50 px-3 py-2 text-left text-xs text-[#2D3142]/75 transition-colors hover:bg-[#E8F0FE] hover:text-[#3E6FD6] cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-auto space-y-3 py-1">
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-[#E8F0FE] px-3.5 py-2.5 text-[0.85rem] leading-[1.6] text-[#2D3142]">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="min-w-0 space-y-1.5">
                    <div className="min-w-0 py-2.5 text-[0.85rem] px-2 leading-[1.6] text-[#2D3142]">
                      {msg.sources && msg.sources.length > 0 && (
                        <SourcesDropdown sources={msg.sources} />
                      )}

                      {msg.isSearching && !msg.content && (
                        <div className="flex items-center gap-2 text-[0.75rem]">
                          <MascotBee pose="focus" className="h-8 w-9 shrink-0" />
                          <span className="bee-shimmer-text">
                            Pesquisando referências na web...
                          </span>
                        </div>
                      )}

                      {!msg.isSearching && !msg.content && (
                        <div className="flex items-center gap-2 text-[0.75rem]">
                          <MascotBee pose="focus" className="h-5 w-6 shrink-0" />
                          <span className="bee-shimmer-text">
                            {msg.thinkingPhrase ?? "Pensando..."}
                          </span>
                        </div>
                      )}

                      {msg.content && (
                        <div className="space-y-2 text-[0.85rem] [&_p]:leading-[1.6] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_strong]:font-semibold [&_strong]:text-[#2D3142]">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ className, children }) {
                                if (className) {
                                  return (
                                    <code className="block overflow-x-auto rounded-xl bg-[#F3EFE6]/70 p-2.5 font-mono text-xs leading-relaxed text-[#2D3142]">
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <code className="rounded bg-[#F3EFE6]/80 px-1 py-0.5 font-mono text-xs text-[#2D3142]">
                                    {children}
                                  </code>
                                );
                              },
                              a({ href, children }) {
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-[#3E6FD6] underline decoration-[#3E6FD6]/30 underline-offset-2 hover:decoration-[#3E6FD6] cursor-pointer"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Container de texto leve colado na base */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="shrink-0 px-5 pt-2 pb-3"
        >
          <div className="flex items-end gap-1.5 rounded-xl bg-[#ffffff]/60 py-1.5 pr-1.5 pl-3 transition-colors focus-within:bg-[#ffffff]">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              disabled={isStreaming}
              placeholder="Pergunte sobre este passo"
              className="min-w-0 max-h-28 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-[0.8rem] leading-[1.45] text-[#2D3142] placeholder:text-[#646B82]/50 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!hasInput}
              aria-label="Enviar pergunta"
              className={`mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                hasInput
                  ? "bg-[#5B8DEF] text-white hover:bg-[#4A7DE0] cursor-pointer"
                  : "bg-transparent text-[#646B82]/35 cursor-default"
              }`}
            >
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
