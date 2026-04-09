"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToWord } from "@/lib/export";
import { PromptBuilderModal } from "@/components/app/PromptBuilderModal";
import { FileUploadButton, type UploadedFile } from "@/components/app/FileUploadButton";

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

const SUGGESTED_PROMPTS: Record<string, { icon: string; text: string }[]> = {
  rh: [
    { icon: "📋", text: "Crie uma descrição de vaga para [cargo] com os requisitos principais" },
    { icon: "🔍", text: "Analise este currículo para a vaga de [cargo]: [cole o currículo]" },
    { icon: "💬", text: "Sugira 5 perguntas de entrevista para avaliar [competência]" },
    { icon: "📅", text: "Monte um plano de onboarding de 30 dias para [cargo]" },
  ],
  marketing: [
    { icon: "📱", text: "Crie um post para Instagram sobre [tema] com chamada para ação" },
    { icon: "📧", text: "Escreva um e-mail marketing para [produto/serviço] para [público]" },
    { icon: "📝", text: "Sugira 10 ideias de conteúdo para [canal] sobre [tema]" },
    { icon: "🎯", text: "Monte uma estratégia de lançamento para [produto/evento]" },
  ],
  comercial: [
    { icon: "📞", text: "Crie um script de abordagem para [tipo de cliente]" },
    { icon: "📊", text: "Monte uma proposta comercial para [produto/serviço]" },
    { icon: "💡", text: "Sugira argumentos para superar a objeção de [objeção]" },
    { icon: "✉️", text: "Escreva um e-mail de follow-up após reunião com [cliente]" },
  ],
  financeiro: [
    { icon: "📊", text: "Explique [conceito financeiro] de forma simples" },
    { icon: "📈", text: "Monte um relatório de despesas para o mês de [mês]" },
    { icon: "🧮", text: "Calcule o ponto de equilíbrio para [produto/serviço]" },
    { icon: "📋", text: "Crie um modelo de planilha para controle de [receitas/despesas]" },
  ],
  administrativo: [
    { icon: "📝", text: "Redija um e-mail formal para [destinatário] sobre [assunto]" },
    { icon: "📋", text: "Monte uma ata de reunião com os pontos: [pontos discutidos]" },
    { icon: "📅", text: "Crie um cronograma para [projeto/evento] com prazo em [data]" },
    { icon: "🗂️", text: "Organize estes documentos por [critério]: [lista de itens]" },
  ],
};

const DEFAULT_PROMPTS = [
  { icon: "💬", text: "Como você pode me ajudar?" },
  { icon: "📋", text: "Quais são suas principais capacidades?" },
  { icon: "🚀", text: "Me dê um exemplo do que você faz" },
  { icon: "🎯", text: "Qual tarefa mais comum você resolve?" },
];

// Renderiza markdown do assistente com estilos humanizados
function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <p className="mt-3 mb-1 text-base font-bold text-gray-900 first:mt-0">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="mt-3 mb-1 text-sm font-bold text-gray-900 first:mt-0">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="mt-2 mb-0.5 text-sm font-semibold text-gray-800 first:mt-0">{children}</p>
        ),
        p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: "disc" }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: "decimal" }}>
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs font-mono text-green-300 whitespace-pre">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-amber-50 border border-amber-100 px-1 py-0.5 text-xs font-mono text-amber-800">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
        hr: () => <hr className="my-3 border-gray-200" />,
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-amber-300 pl-3 text-gray-600 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto rounded-lg border border-gray-200 last:mb-0">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-gray-100 px-3 py-2 text-xs text-gray-700 last:border-b-0">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Tela inicial quando não há mensagens
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
  const prompts = SUGGESTED_PROMPTS[agentType] ?? DEFAULT_PROMPTS;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Saudação */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Como posso ajudar você hoje?
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Clique em uma sugestão abaixo ou escreva diretamente no campo de mensagem.
          </p>
        </div>

        {/* Sugestões de prompts */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {prompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onSuggest(p.text)}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm cursor-pointer"
            >
              <span className="mt-0.5 shrink-0 text-base">{p.icon}</span>
              <span className="leading-snug">{p.text}</span>
            </button>
          ))}
        </div>

        {/* Modo Guiado em destaque */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Nunca usou IA antes?
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                O <strong>Modo Guiado</strong> te ajuda a montar um pedido perfeito passo a passo — sem precisar saber escrever prompts.
              </p>
            </div>
            <button
              onClick={onGuided}
              className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#E8A020" }}
            >
              Usar Modo Guiado
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

  // Auto-resize do textarea conforme o usuário digita
  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  // Função unificada de streaming — usada pelo envio normal e pelo Modo Guiado
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
              content:
                "Tokens esgotados. Entre em contato com o administrador para adquirir um Token Pack e retomar o uso dos agentes.",
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

        // Atualiza contador de tokens no header sem recarregar a página
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
      fullContent = `${text}\n\n[Arquivo anexado: ${pendingFile.fileName} — sem conteúdo extraído ainda]`;
    }

    setInput("");
    setPendingFile(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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

      <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-5 py-3.5">
          {agentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agentAvatarUrl}
              alt={agentDisplayName}
              className="h-9 w-9 rounded-xl border border-gray-100"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg border border-amber-100">
              🤖
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{agentDisplayName}</p>
            <p className="text-xs text-gray-400">
              Agente de {AGENT_TYPE_LABELS[agentType] ?? agentType}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {messages.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  title="Exportar PDF"
                  className="rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 cursor-pointer"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport("word")}
                  disabled={exporting}
                  title="Exportar Word"
                  className="rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 cursor-pointer"
                >
                  Word
                </button>
              </div>
            )}
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>

        {/* Área de mensagens / estado vazio */}
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
                          className="h-7 w-7 rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-sm border border-amber-100">
                          🤖
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user" ? { backgroundColor: "#E8A020" } : undefined
                    }
                  >
                    {msg.role === "assistant" ? (
                      <>
                        {msg.content === "" && streaming && i === messages.length - 1 ? (
                          <span className="inline-flex gap-1 py-0.5">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                          </span>
                        ) : (
                          <AssistantMessage content={msg.content} />
                        )}
                        {streaming && i === messages.length - 1 && msg.content !== "" && (
                          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-gray-400" />
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
        <div className="border-t px-4 py-3">
          {tokenBlocked ? (
            <div className="flex items-center justify-center rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Tokens esgotados — contate o administrador para continuar
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFile && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <span className="text-sm">📎</span>
                  <span className="flex-1 truncate text-xs text-amber-800">{pendingFile.fileName}</span>
                  {pendingFile.isAudio && pendingFile.transcriptionStatus === "pending" && (
                    <span className="text-xs text-amber-600">aguardando transcrição...</span>
                  )}
                  <button
                    onClick={() => setPendingFile(null)}
                    className="text-xs text-amber-400 hover:text-amber-700 cursor-pointer"
                  >
                    ✕
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
                      : `Mensagem para ${agentDisplayName}... (Enter para enviar, Shift+Enter para nova linha)`
                  }
                  disabled={streaming}
                  rows={1}
                  className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                  style={{ minHeight: "42px", maxHeight: "200px" }}
                  autoFocus
                />
                <Button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  className="shrink-0 self-end font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: "#E8A020" }}
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
                  className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-amber-600 disabled:opacity-40 cursor-pointer"
                >
                  <span>✨</span>
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
