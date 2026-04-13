"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToWord } from "@/lib/export";
import { PromptBuilderModal } from "@/components/app/PromptBuilderModal";
import { FileUploadButton, type UploadedFile } from "@/components/app/FileUploadButton";
import {
  Bot,
  Sparkles,
  Paperclip,
  X,
  ClipboardList,
  Search,
  MessageCircle,
  Calendar,
  Smartphone,
  Mail,
  FileText,
  Target,
  Phone,
  BarChart2,
  Lightbulb,
  TrendingUp,
  Calculator,
  FolderOpen,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  agentId: string;
  agentDisplayName: string;
  agentAvatarUrl: string | null;
  agentType: string;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

type PromptItem = { icon: React.ElementType; text: string };

const SUGGESTED_PROMPTS: Record<string, PromptItem[]> = {
  rh: [
    { icon: ClipboardList, text: "Crie uma descrição de vaga para [cargo] com os requisitos principais" },
    { icon: Search,        text: "Analise este currículo para a vaga de [cargo]: [cole o currículo]" },
    { icon: MessageCircle, text: "Sugira 5 perguntas de entrevista para avaliar [competência]" },
    { icon: Calendar,      text: "Monte um plano de onboarding de 30 dias para [cargo]" },
  ],
  marketing: [
    { icon: Smartphone,   text: "Crie um post para Instagram sobre [tema] com chamada para ação" },
    { icon: Mail,         text: "Escreva um e-mail marketing para [produto/serviço] para [público]" },
    { icon: FileText,     text: "Sugira 10 ideias de conteúdo para [canal] sobre [tema]" },
    { icon: Target,       text: "Monte uma estratégia de lançamento para [produto/evento]" },
  ],
  comercial: [
    { icon: Phone,        text: "Crie um script de abordagem para [tipo de cliente]" },
    { icon: BarChart2,    text: "Monte uma proposta comercial para [produto/serviço]" },
    { icon: Lightbulb,    text: "Sugira argumentos para superar a objeção de [objeção]" },
    { icon: Mail,         text: "Escreva um e-mail de follow-up após reunião com [cliente]" },
  ],
  financeiro: [
    { icon: BarChart2,    text: "Explique [conceito financeiro] de forma simples" },
    { icon: TrendingUp,   text: "Monte um relatório de despesas para o mês de [mês]" },
    { icon: Calculator,   text: "Calcule o ponto de equilíbrio para [produto/serviço]" },
    { icon: ClipboardList,text: "Crie um modelo de planilha para controle de [receitas/despesas]" },
  ],
  administrativo: [
    { icon: Mail,         text: "Redija um e-mail formal para [destinatário] sobre [assunto]" },
    { icon: ClipboardList,text: "Monte uma ata de reunião com os pontos: [pontos discutidos]" },
    { icon: Calendar,     text: "Crie um cronograma para [projeto/evento] com prazo em [data]" },
    { icon: FolderOpen,   text: "Organize estes documentos por [critério]: [lista de itens]" },
  ],
};

const DEFAULT_PROMPTS: PromptItem[] = [
  { icon: MessageCircle, text: "Como você pode me ajudar?" },
  { icon: ClipboardList, text: "Quais são suas principais capacidades?" },
  { icon: Target,        text: "Me dê um exemplo do que você faz" },
  { icon: Lightbulb,     text: "Qual tarefa mais comum você resolve?" },
];

function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <p className="mt-3 mb-1 text-sm font-bold first:mt-0" style={{ color: "#F2F0EA" }}>{children}</p>
        ),
        h2: ({ children }) => (
          <p className="mt-3 mb-1 text-sm font-bold first:mt-0" style={{ color: "#F2F0EA" }}>{children}</p>
        ),
        h3: ({ children }) => (
          <p className="mt-2 mb-0.5 text-sm font-semibold first:mt-0" style={{ color: "#E0DFDA" }}>{children}</p>
        ),
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed last:mb-0" style={{ color: "#C0BFC9" }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: "disc", color: "#C0BFC9" }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: "decimal", color: "#C0BFC9" }}>
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold" style={{ color: "#F2F0EA" }}>{children}</strong>
        ),
        em: ({ children }) => <em className="italic" style={{ color: "#A0A0AA" }}>{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code
                className="block overflow-x-auto rounded-[6px] p-3 text-xs font-mono whitespace-pre"
                style={{ background: "#0A0A0F", color: "#34D399", border: "1px solid rgba(52,211,153,0.15)" }}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="rounded-[3px] px-1.5 py-0.5 text-xs font-mono"
              style={{ background: "rgba(232,160,32,0.1)", color: "#E8A020", border: "1px solid rgba(232,160,32,0.2)" }}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
        hr: () => <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.08)" }} />,
        blockquote: ({ children }) => (
          <blockquote
            className="mb-2 pl-3 italic"
            style={{ borderLeft: "2px solid rgba(232,160,32,0.4)", color: "#8A8994" }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto rounded-[6px] last:mb-0" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th
            className="px-3 py-2 text-left text-[11px] font-semibold"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8A8994" }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            className="px-3 py-2 text-xs"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#C0BFC9" }}
          >
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function EmptyState({
  agentName,
  agentType,
  onSuggest,
  onGuided,
}: {
  agentName: string;
  agentType: string;
  onSuggest: (text: string) => void;
  onGuided: () => void;
}) {
  const prompts: PromptItem[] = SUGGESTED_PROMPTS[agentType] ?? DEFAULT_PROMPTS;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-5">
        <div className="text-center">
          <p className="text-[15px] font-semibold" style={{ color: "#F2F0EA", letterSpacing: "-0.02em" }}>
            Como posso ajudar, hoje?
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#64636E" }}>
            Selecione uma sugestão ou escreva diretamente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {prompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => onSuggest(p.text)}
                className="group flex items-start gap-3 rounded-[8px] px-4 py-3 text-left text-[13px] transition-all duration-150 hover:bg-white/[0.04] cursor-pointer"
                style={{ border: "1px solid rgba(255,255,255,0.07)", color: "#8A8994" }}
              >
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0 transition-colors group-hover:text-[#E8A020]"
                  style={{ color: "#3D3D50" }}
                  strokeWidth={1.75}
                />
                <span className="leading-snug group-hover:text-[#C0BFC9]">{p.text}</span>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-[8px] px-5 py-4"
          style={{ background: "rgba(232,160,32,0.06)", border: "1px solid rgba(232,160,32,0.18)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E8A020" }}>
                Nunca usou IA antes?
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "#8A6A30" }}>
                O <strong style={{ color: "#E8A020" }}>Modo Guiado</strong> monta seu pedido passo a passo — sem precisar saber escrever prompts.
              </p>
            </div>
            <button
              onClick={onGuided}
              className="shrink-0 flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-[12px] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: "#E8A020", color: "#09090E" }}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              Modo Guiado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface({
  agentId,
  agentDisplayName,
  agentAvatarUrl,
  agentType,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [tokenBlocked, setTokenBlocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGuided, setShowGuided] = useState(false);
  const [pendingFile, setPendingFile] = useState<UploadedFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  const streamMessage = useCallback(
    async (fullContent: string, displayContent: string, currentMessages: Message[]) => {
      const userMsg: Message = { role: "user", content: displayContent };
      const newMessages = [...currentMessages, { role: "user" as const, content: fullContent }];
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, sessionId, messages: newMessages }),
        });

        const newSessionId = res.headers.get("X-Session-Id");
        if (newSessionId) setSessionId(newSessionId);

        if (res.status === 402) {
          setTokenBlocked(true);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "Tokens esgotados. Entre em contato com o administrador para adquirir um Token Pack.",
            };
            return updated;
          });
          return;
        }

        if (!res.ok || !res.body) throw new Error("Erro na resposta");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: full };
            return updated;
          });
        }

        router.refresh();
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Ocorreu um erro ao processar sua mensagem. Tente novamente.",
          };
          return updated;
        });
      } finally {
        setStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [agentId, sessionId, router]
  );

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || tokenBlocked) return;

    let fullContent = text;
    if (pendingFile?.extractedText) {
      fullContent = `${text}\n\n---\nArquivo anexado: ${pendingFile.fileName}\n\nConteúdo:\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile?.isAudio && pendingFile.transcriptionStatus === "completed" && pendingFile.extractedText) {
      fullContent = `${text}\n\n---\nTranscrição do áudio "${pendingFile.fileName}":\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile) {
      fullContent = `${text}\n\n[Arquivo: ${pendingFile.fileName}]`;
    }

    setInput("");
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await streamMessage(fullContent, text, messages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleExport(format: "pdf" | "word") {
    if (messages.length === 0 || exporting) return;
    setExporting(true);
    try {
      const opts = { agentName: agentDisplayName, agentType, messages };
      if (format === "pdf") await exportToPDF(opts);
      else await exportToWord(opts);
    } finally {
      setExporting(false);
    }
  }

  function handleGuidedConfirm(finalPrompt: string) {
    setShowGuided(false);
    streamMessage(finalPrompt, finalPrompt, messages);
  }

  function handleSuggest(text: string) {
    setInput(text);
    setTimeout(() => {
      textareaRef.current?.focus();
      autoResize();
    }, 0);
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {showGuided && (
        <PromptBuilderModal
          agentName={agentDisplayName}
          onClose={() => setShowGuided(false)}
          onConfirm={handleGuidedConfirm}
        />
      )}

      <div
        className="flex h-full flex-col overflow-hidden"
        style={{
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {agentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agentAvatarUrl}
              alt={agentDisplayName}
              className="h-9 w-9 rounded-[6px] object-cover"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[6px]"
              style={{ background: "rgba(232,160,32,0.1)", border: "1px solid rgba(232,160,32,0.2)" }}
            >
              <Bot className="h-5 w-5" style={{ color: "#E8A020" }} strokeWidth={1.75} />
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#F2F0EA", letterSpacing: "-0.01em" }}>
              {agentDisplayName}
            </p>
            <p className="text-[11px]" style={{ color: "#3D3D50" }}>
              Agente de {AGENT_TYPE_LABELS[agentType] ?? agentType}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {messages.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="rounded-[5px] px-2 py-1 text-[11px] transition-all duration-150 hover:bg-white/[0.06] disabled:opacity-40 cursor-pointer"
                  style={{ color: "#3D3D50" }}
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport("word")}
                  disabled={exporting}
                  className="rounded-[5px] px-2 py-1 text-[11px] transition-all duration-150 hover:bg-white/[0.06] disabled:opacity-40 cursor-pointer"
                  style={{ color: "#3D3D50" }}
                >
                  Word
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" style={{ boxShadow: "0 0 4px rgba(52,211,153,0.6)" }} />
              <span className="text-[11px]" style={{ color: "#3D3D50" }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState
              agentName={agentDisplayName}
              agentType={agentType}
              onSuggest={handleSuggest}
              onGuided={() => setShowGuided(true)}
            />
          ) : (
            <div className="px-5 py-4 space-y-5">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2.5 mt-1 shrink-0">
                      {agentAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={agentAvatarUrl}
                          alt={agentDisplayName}
                          className="h-6 w-6 rounded-[4px] object-cover"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                      ) : (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-[4px]"
                          style={{ background: "rgba(232,160,32,0.1)", border: "1px solid rgba(232,160,32,0.15)" }}
                        >
                          <Bot className="h-3.5 w-3.5" style={{ color: "#E8A020" }} strokeWidth={2} />
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className="max-w-[78%] rounded-[10px] px-4 py-3 text-[13px]"
                    style={
                      msg.role === "user"
                        ? {
                            background: "#E8A020",
                            color: "#0D0B00",
                            borderBottomRightRadius: "3px",
                          }
                        : {
                            background: "#18181F",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderBottomLeftRadius: "3px",
                          }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <>
                        {msg.content === "" && streaming && i === messages.length - 1 ? (
                          <span className="inline-flex gap-1 py-0.5">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "#3D3D50", animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "#3D3D50", animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "#3D3D50", animationDelay: "300ms" }} />
                          </span>
                        ) : (
                          <AssistantMessage content={msg.content} />
                        )}
                        {streaming && i === messages.length - 1 && msg.content !== "" && (
                          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse rounded-full" style={{ background: "#E8A020" }} />
                        )}
                      </>
                    ) : (
                      <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {tokenBlocked ? (
            <div
              className="flex items-center justify-center rounded-[8px] px-4 py-3 text-[13px]"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
            >
              Tokens esgotados — contate o administrador para continuar
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFile && (
                <div
                  className="flex items-center gap-2 rounded-[6px] px-3 py-2"
                  style={{ background: "rgba(232,160,32,0.06)", border: "1px solid rgba(232,160,32,0.18)" }}
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: "#E8A020" }} strokeWidth={2} />
                  <span className="flex-1 truncate text-[12px]" style={{ color: "#C8962A" }}>
                    {pendingFile.fileName}
                  </span>
                  {pendingFile.isAudio && pendingFile.transcriptionStatus === "pending" && (
                    <span className="text-[11px]" style={{ color: "#8A6A30" }}>transcrevendo...</span>
                  )}
                  <button
                    onClick={() => setPendingFile(null)}
                    className="transition-opacity hover:opacity-70 cursor-pointer"
                    style={{ color: "#8A6A30" }}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoResize();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    pendingFile
                      ? `Diga o que fazer com "${pendingFile.fileName}"...`
                      : `Mensagem... (Enter para enviar)`
                  }
                  disabled={streaming}
                  rows={1}
                  className="flex-1 resize-none overflow-hidden rounded-[8px] px-4 py-2.5 text-[13px] placeholder-[#3D3D50] transition-all duration-150 outline-none disabled:opacity-50"
                  style={{
                    background: "#0D0D14",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "#F2F0EA",
                    minHeight: "42px",
                    maxHeight: "200px",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(232,160,32,0.4)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.09)";
                  }}
                  autoFocus
                />
                <Button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  className="shrink-0 self-end rounded-[8px] text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  style={{ background: "#E8A020", color: "#09090E", border: "none" }}
                >
                  Enviar
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <FileUploadButton
                  agentType={agentType}
                  sessionId={sessionId}
                  onUploaded={(f) => setPendingFile(f)}
                  disabled={streaming}
                />
                <button
                  onClick={() => setShowGuided(true)}
                  disabled={streaming}
                  className="flex items-center gap-1 text-[11px] transition-colors hover:text-[#E8A020] disabled:opacity-40 cursor-pointer"
                  style={{ color: "#3D3D50" }}
                >
                  <Sparkles className="h-3 w-3" strokeWidth={2} />
                  Modo Guiado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
