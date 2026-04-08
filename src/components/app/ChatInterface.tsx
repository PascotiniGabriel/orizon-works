"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ChatInterface({
  agentId,
  agentDisplayName,
  agentAvatarUrl,
  agentType,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [tokenBlocked, setTokenBlocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGuided, setShowGuided] = useState(false);
  const [pendingFile, setPendingFile] = useState<UploadedFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || tokenBlocked) return;

    // Montar conteúdo com contexto do arquivo se houver
    let fullContent = text;
    if (pendingFile?.extractedText) {
      fullContent = `${text}\n\n---\nArquivo anexado: ${pendingFile.fileName}\n\nConteúdo:\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile?.isAudio && pendingFile.transcriptionStatus === "completed" && pendingFile.extractedText) {
      fullContent = `${text}\n\n---\nTranscrição do áudio "${pendingFile.fileName}":\n${pendingFile.extractedText.slice(0, 20000)}`;
    } else if (pendingFile) {
      fullContent = `${text}\n\n[Arquivo anexado: ${pendingFile.fileName} — sem conteúdo extraído ainda]`;
    }

    const userMsg: Message = { role: "user", content: text }; // exibe o texto original
    const newMessages = [...messages, { role: "user" as const, content: fullContent }];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingFile(null);
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          sessionId,
          messages: newMessages,
        }),
      });
      // (uploadId já foi injetado no conteúdo da mensagem — não precisa de campo extra)

      // Capturar sessionId do header para manter continuidade
      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId) setSessionId(newSessionId);

      if (res.status === 402) {
        setTokenBlocked(true);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "⚠️ Tokens esgotados. Entre em contato com o administrador para adquirir um Token Pack e retomar o uso dos agentes.",
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
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleExport(format: "pdf" | "word") {
    if (messages.length === 0 || exporting) return;
    setExporting(true);
    try {
      const opts = {
        agentName: agentDisplayName,
        agentType,
        messages,
      };
      if (format === "pdf") await exportToPDF(opts);
      else await exportToWord(opts);
    } finally {
      setExporting(false);
    }
  }

  function handleGuidedConfirm(finalPrompt: string) {
    setShowGuided(false);
    setInput(finalPrompt);
    // Pequeno delay para garantir que o estado foi atualizado antes de enviar
    setTimeout(() => {
      const userMsg: Message = { role: "user", content: finalPrompt };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, sessionId, messages: newMessages }),
      }).then(async (res) => {
        const newSessionId = res.headers.get("X-Session-Id");
        if (newSessionId) setSessionId(newSessionId);

        if (res.status === 402) {
          setTokenBlocked(true);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "⚠️ Tokens esgotados. Entre em contato com o administrador.",
            };
            return updated;
          });
          setStreaming(false);
          return;
        }

        if (!res.ok || !res.body) { setStreaming(false); return; }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: full };
            return updated;
          });
        }
        setStreaming(false);
        inputRef.current?.focus();
      }).catch(() => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Ocorreu um erro. Tente novamente.",
          };
          return updated;
        });
        setStreaming(false);
      });
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
      {/* Header do chat */}
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
                className="rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport("word")}
                disabled={exporting}
                title="Exportar Word"
                className="rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
              >
                Word
              </button>
            </div>
          )}
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <div className="mb-3 text-4xl">💬</div>
            <p className="text-sm font-medium text-gray-600">
              Como posso ajudar?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Faça uma pergunta para {agentDisplayName}.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 shrink-0">
                  {agentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agentAvatarUrl}
                      alt={agentDisplayName}
                      className="h-6 w-6 rounded-lg border border-gray-100"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-xs border border-amber-100">
                      🤖
                    </div>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-gray-50 text-gray-800 border rounded-tl-sm"
                }`}
                style={
                  msg.role === "user" ? { backgroundColor: "#E8A020" } : undefined
                }
              >
                {msg.content}
                {msg.role === "assistant" &&
                  streaming &&
                  i === messages.length - 1 &&
                  msg.content === "" && (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                {msg.role === "assistant" &&
                  streaming &&
                  i === messages.length - 1 &&
                  msg.content !== "" && (
                    <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
                  )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        {tokenBlocked ? (
          <div className="flex items-center justify-center rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ Tokens esgotados — contate o administrador
          </div>
        ) : (
          <div className="space-y-2">
            {pendingFile && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <span className="text-sm">📎</span>
                <span className="flex-1 truncate text-xs text-amber-800">{pendingFile.fileName}</span>
                {pendingFile.isAudio && pendingFile.transcriptionStatus === "pending" && (
                  <span className="text-xs text-amber-600">aguardando transcrição</span>
                )}
                <button
                  onClick={() => setPendingFile(null)}
                  className="text-xs text-amber-400 hover:text-amber-700"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  pendingFile
                    ? `Diga o que fazer com "${pendingFile.fileName}"...`
                    : `Mensagem para ${agentDisplayName}...`
                }
                disabled={streaming}
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="shrink-0 font-semibold text-white"
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
                className="text-xs text-gray-400 transition-colors hover:text-amber-600 disabled:opacity-40"
              >
                ✨ Modo Guiado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
