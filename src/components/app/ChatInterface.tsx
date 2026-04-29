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
  Bot, Sparkles, Paperclip, X, ClipboardList, Search, MessageCircle,
  Calendar, Smartphone, Mail, FileText, Target, Phone, BarChart2,
  Lightbulb, TrendingUp, Calculator, FolderOpen,
} from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }
interface ChatInterfaceProps {
  agentId: string;
  agentDisplayName: string;
  agentAvatarUrl: string | null;
  agentType: string;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
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
    { icon: Phone,     text: "Crie um script de abordagem para [tipo de cliente]" },
    { icon: BarChart2, text: "Monte uma proposta comercial para [produto/serviço]" },
    { icon: Lightbulb, text: "Sugira argumentos para superar a objeção de [objeção]" },
    { icon: Mail,      text: "Escreva um e-mail de follow-up após reunião com [cliente]" },
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

/* ── Markdown renderer ── */
function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <p style={{ marginTop: "14px", marginBottom: "6px", fontSize: "18px", fontWeight: 700, color: "#EBEBEB", letterSpacing: "-0.02em" }}>{children}</p>,
        h2: ({ children }) => <p style={{ marginTop: "14px", marginBottom: "6px", fontSize: "17px", fontWeight: 700, color: "#EBEBEB" }}>{children}</p>,
        h3: ({ children }) => <p style={{ marginTop: "12px", marginBottom: "4px", fontSize: "16px", fontWeight: 600, color: "#DDDDDD" }}>{children}</p>,
        p:  ({ children }) => <p style={{ marginBottom: "12px", lineHeight: "1.75", color: "#C8C8C8", fontSize: "16px" }}>{children}</p>,
        ul: ({ children }) => <ul style={{ marginBottom: "12px", paddingLeft: "22px", listStyleType: "disc", color: "#C8C8C8" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ marginBottom: "12px", paddingLeft: "22px", listStyleType: "decimal", color: "#C8C8C8" }}>{children}</ol>,
        li: ({ children }) => <li style={{ lineHeight: "1.75", fontSize: "16px", marginBottom: "4px" }}>{children}</li>,
        strong: ({ children }) => <strong style={{ fontWeight: 600, color: "#EBEBEB" }}>{children}</strong>,
        em:     ({ children }) => <em style={{ fontStyle: "italic", color: "#AAAAAA" }}>{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code style={{ display: "block", overflowX: "auto", borderRadius: "6px", padding: "14px", fontSize: "14px", fontFamily: "var(--font-geist-mono)", whiteSpace: "pre", background: "#0A0A0A", color: "#10B981", border: "1px solid rgba(16,185,129,0.15)" }}>{children}</code>
          ) : (
            <code style={{ borderRadius: "3px", padding: "2px 6px", fontSize: "14px", fontFamily: "var(--font-geist-mono)", background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>{children}</code>
          );
        },
        pre:        ({ children }) => <div style={{ marginBottom: "12px" }}>{children}</div>,
        hr:         () =>             <hr style={{ margin: "14px 0", borderColor: "rgba(255,255,255,0.08)" }} />,
        blockquote: ({ children }) => <blockquote style={{ marginBottom: "12px", paddingLeft: "14px", fontStyle: "italic", borderLeft: "2px solid rgba(16,185,129,0.4)", color: "#888", fontSize: "15px" }}>{children}</blockquote>,
        table: ({ children }) => <div style={{ marginBottom: "12px", overflowX: "auto", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>{children}</table></div>,
        th: ({ children }) => <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#888" }}>{children}</th>,
        td: ({ children }) => <td style={{ padding: "10px 14px", fontSize: "15px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#C8C8C8" }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Empty state ── */
function EmptyState({ agentName, agentType, onSuggest, onGuided }: {
  agentName: string; agentType: string;
  onSuggest: (text: string) => void; onGuided: () => void;
}) {
  const prompts: PromptItem[] = SUGGESTED_PROMPTS[agentType] ?? DEFAULT_PROMPTS;
  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#EBEBEB", letterSpacing: "-0.03em", marginBottom: "8px" }}>
            Como posso ajudar, hoje?
          </p>
          <p style={{ color: "#555", fontSize: "15px" }}>
            Selecione uma sugestão ou escreva diretamente.
          </p>
        </div>

        {/* Suggestion grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          {prompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => onSuggest(p.text)}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", textAlign: "left", fontSize: "15px", lineHeight: "1.55", color: "#888", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#EBEBEB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888"; }}
              >
                <Icon style={{ width: "16px", height: "16px", color: "#3A3A3A", marginTop: "2px", flexShrink: 0 }} strokeWidth={1.75} />
                <span>{p.text}</span>
              </button>
            );
          })}
        </div>

        {/* Guided banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 20px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px" }}>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#10B981", marginBottom: "4px" }}>
              Nunca usou IA antes?
            </p>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.55" }}>
              O <strong style={{ color: "#10B981", fontWeight: 600 }}>Modo Guiado</strong> monta seu pedido passo a passo — sem precisar saber escrever prompts.
            </p>
          </div>
          <button
            onClick={onGuided}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "14px", borderRadius: "7px", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            <Sparkles style={{ width: "14px", height: "14px" }} strokeWidth={2.5} />
            Modo Guiado
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ChatInterface({ agentId, agentDisplayName, agentAvatarUrl, agentType }: ChatInterfaceProps) {
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  const streamMessage = useCallback(async (fullContent: string, displayContent: string, currentMessages: Message[]) => {
    const userMsg: Message = { role: "user", content: displayContent };
    const newMessages = [...currentMessages, { role: "user" as const, content: fullContent }];
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
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
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "Créditos esgotados. Entre em contato com o administrador para adquirir mais créditos." }; return u; });
        return;
      }
      if (!res.ok || !res.body) throw new Error("Erro na resposta");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: full }; return u; });
      }
      router.refresh();
    } catch {
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "Ocorreu um erro ao processar sua mensagem. Tente novamente." }; return u; });
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  }, [agentId, sessionId, router]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || tokenBlocked) return;
    let fullContent = text;
    if (pendingFile?.extractedText) {
      fullContent = `${text}\n\n---\nArquivo: ${pendingFile.fileName}\n\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile?.isAudio && pendingFile.transcriptionStatus === "completed" && pendingFile.extractedText) {
      fullContent = `${text}\n\n---\nTranscrição: "${pendingFile.fileName}":\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile) {
      fullContent = `${text}\n\n[Arquivo: ${pendingFile.fileName}]`;
    }
    setInput("");
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await streamMessage(fullContent, text, messages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function handleExport(format: "pdf" | "word") {
    if (messages.length === 0 || exporting) return;
    setExporting(true);
    try {
      const opts = { agentName: agentDisplayName, agentType, messages };
      if (format === "pdf") await exportToPDF(opts); else await exportToWord(opts);
    } finally { setExporting(false); }
  }

  function handleGuidedConfirm(finalPrompt: string) { setShowGuided(false); streamMessage(finalPrompt, finalPrompt, messages); }
  function handleSuggest(text: string) { setInput(text); setTimeout(() => { textareaRef.current?.focus(); autoResize(); }, 0); }

  const isEmpty = messages.length === 0;

  return (
    <>
      {showGuided && <PromptBuilderModal agentName={agentDisplayName} onClose={() => setShowGuided(false)} onConfirm={handleGuidedConfirm} />}

      <div className="flex h-full flex-col overflow-hidden" style={{ background: "#111111" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {agentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agentAvatarUrl} alt={agentDisplayName} style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }} />
          ) : (
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot style={{ width: "20px", height: "20px", color: "#10B981" }} strokeWidth={1.75} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#EBEBEB", letterSpacing: "-0.02em" }}>{agentDisplayName}</p>
            <p style={{ fontSize: "13px", color: "#3A3A3A", marginTop: "1px" }}>Agente de {AGENT_TYPE_LABELS[agentType] ?? agentType}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {messages.length > 0 && (
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => handleExport("pdf")} disabled={exporting} style={{ padding: "5px 10px", borderRadius: "5px", fontSize: "13px", color: "#555", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>PDF</button>
                <button onClick={() => handleExport("word")} disabled={exporting} style={{ padding: "5px 10px", borderRadius: "5px", fontSize: "13px", color: "#555", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Word</button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.5)", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#3A3A3A" }}>Online</span>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {isEmpty ? (
            <EmptyState agentName={agentDisplayName} agentType={agentType} onSuggest={handleSuggest} onGuided={() => setShowGuided(true)} />
          ) : (
            <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <div style={{ marginRight: "12px", marginTop: "4px", flexShrink: 0 }}>
                      {agentAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={agentAvatarUrl} alt={agentDisplayName} style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }} />
                      ) : (
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Bot style={{ width: "15px", height: "15px", color: "#10B981" }} strokeWidth={2} />
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ maxWidth: "76%", borderRadius: "12px", padding: "14px 18px", fontSize: "16px", lineHeight: "1.7", ...(msg.role === "user" ? { background: "#10B981", color: "#000", borderBottomRightRadius: "4px", fontWeight: 500 } : { background: "#181818", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: "4px" }) }}>
                    {msg.role === "assistant" ? (
                      <>
                        {msg.content === "" && streaming && i === messages.length - 1 ? (
                          <span style={{ display: "inline-flex", gap: "5px", padding: "4px 0" }}>
                            {[0, 200, 400].map((d) => <span key={d} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", display: "inline-block", animation: `bounce 1.2s ${d}ms infinite` }} />)}
                          </span>
                        ) : (
                          <AssistantMessage content={msg.content} />
                        )}
                        {streaming && i === messages.length - 1 && msg.content !== "" && (
                          <span style={{ display: "inline-block", width: "2px", height: "16px", borderRadius: "1px", background: "#10B981", marginLeft: "2px", verticalAlign: "middle", animation: "pulse 1s infinite" }} />
                        )}
                      </>
                    ) : (
                      <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {tokenBlocked ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 16px", borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", fontSize: "15px" }}>
              Créditos esgotados — contate o administrador para continuar
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {pendingFile && (
                <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 14px", borderRadius: "7px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <Paperclip style={{ width: "14px", height: "14px", color: "#10B981", flexShrink: 0 }} strokeWidth={2} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "14px", color: "#10B981" }}>{pendingFile.fileName}</span>
                  {pendingFile.isAudio && pendingFile.transcriptionStatus === "pending" && <span style={{ fontSize: "13px", color: "#555" }}>transcrevendo...</span>}
                  <button onClick={() => setPendingFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 0, display: "flex" }}>
                    <X style={{ width: "14px", height: "14px" }} strokeWidth={2} />
                  </button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingFile ? `Diga o que fazer com "${pendingFile.fileName}"...` : `Mensagem... (Enter para enviar)`}
                  disabled={streaming}
                  rows={1}
                  style={{ flex: 1, resize: "none", overflow: "hidden", borderRadius: "8px", padding: "13px 16px", fontSize: "15px", background: "#161616", border: "1px solid rgba(255,255,255,0.08)", color: "#EBEBEB", minHeight: "48px", maxHeight: "200px", fontFamily: "inherit", outline: "none", lineHeight: "1.5", transition: "border-color 0.12s" }}
                  onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  autoFocus
                />
                <Button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  style={{ background: "#10B981", color: "#000", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, padding: "0 22px", height: "48px", flexShrink: 0, cursor: streaming || !input.trim() ? "not-allowed" : "pointer", opacity: streaming || !input.trim() ? 0.4 : 1, transition: "opacity 0.12s" }}
                >
                  Enviar
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <FileUploadButton agentType={agentType} sessionId={sessionId} onUploaded={(f) => setPendingFile(f)} disabled={streaming} />
                <button
                  onClick={() => setShowGuided(true)}
                  disabled={streaming}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#3A3A3A", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#3A3A3A"; }}
                >
                  <Sparkles style={{ width: "13px", height: "13px" }} strokeWidth={2} />
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
