"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "./OnboardingProgress";
import { DocumentUpload } from "./DocumentUpload";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente de configuração da OrizonWorks. Vou fazer algumas perguntas para personalizar seus agentes de IA.\n\nPara começar: qual é o nome da sua empresa e em qual segmento ela atua?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || done) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Erro na resposta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }

      // Detectar campos coletados
      const allText = [...newMessages.map((m) => m.content), full].join(" ").toLowerCase();
      const detected: string[] = [];
      if (allText.includes("segmento") || allText.includes("setor") || allText.includes("área")) detected.push("segment");
      if (allText.includes("missão") || allText.includes("propósito")) detected.push("mission");
      if (allText.includes("valores") || allText.includes("cultura")) detected.push("values");
      if (allText.includes("tom") || allText.includes("comunicação")) detected.push("communicationTone");
      if (allText.includes("público") || allText.includes("cliente")) detected.push("targetAudience");
      if (allText.includes("produto") || allText.includes("serviço")) detected.push("mainProducts");
      setCompletedFields([...new Set(detected)]);

      if (full.includes("BRIEFING_COMPLETO")) {
        setDone(true);
        setTimeout(() => {
          startTransition(() => router.push("/onboarding/setor"));
        }, 2500);
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
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

  function handleDocumentUploaded(message: string) {
    setMessages((prev) => [
      ...prev,
      { role: "system", content: message },
    ]);
  }

  const visibleMessages = messages
    .map((m) => ({
      ...m,
      content: m.content.replace(/BRIEFING_COMPLETO[\s\S]*/g, "").trim(),
    }))
    .filter((m) => m.content.length > 0);

  return (
    <div style={{ display: "flex", height: "100%", gap: "20px" }}>
      {/* Sidebar de progresso */}
      <aside className="hidden lg:block" style={{ width: "200px", flexShrink: 0 }}>
        <OnboardingProgress completedFields={completedFields} />
      </aside>

      {/* Chat */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
        borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
        background: "#111111",
      }}>
        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : msg.role === "system" ? "center" : "flex-start" }}
            >
              {msg.role === "system" ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  borderRadius: "999px", border: "1px solid rgba(16,185,129,0.2)",
                  background: "rgba(16,185,129,0.08)", padding: "4px 12px",
                  fontSize: "12px", color: "#10B981",
                }}>
                  <span>📎</span>
                  {msg.content}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "80%", borderRadius: "14px", padding: "10px 14px",
                    fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap",
                    ...(msg.role === "user"
                      ? { background: "#10B981", color: "#000", fontWeight: 500 }
                      : { background: "rgba(255,255,255,0.04)", color: "#EBEBEB", border: "1px solid rgba(255,255,255,0.07)" }
                    ),
                  }}
                >
                  {msg.content}
                  {msg.role === "assistant" && streaming && i === visibleMessages.length - 1 && (
                    <span style={{ marginLeft: "4px", display: "inline-block", width: "2px", height: "12px", background: "#555", animation: "pulse 1s infinite" }} />
                  )}
                </div>
              )}
            </div>
          ))}
          {done && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                borderRadius: "999px", background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)", padding: "8px 18px",
                fontSize: "13px", color: "#10B981", fontWeight: 500,
              }}>
                Empresa configurada! Avançando para o próximo passo...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
          <DocumentUpload
            onUploaded={handleDocumentUploaded}
            disabled={streaming || done}
          />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
            disabled={streaming || done}
            autoFocus
            style={{
              flex: 1, height: "34px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              color: "#EBEBEB", fontSize: "14px", padding: "0 12px",
              outline: "none", transition: "border-color 0.15s",
              opacity: (streaming || done) ? 0.5 : 1,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || done || !input.trim()}
            style={{
              height: "34px", padding: "0 16px", borderRadius: "6px",
              background: "#10B981", color: "#000", fontWeight: 700, fontSize: "13px",
              border: "none", cursor: "pointer", flexShrink: 0,
              opacity: (streaming || done || !input.trim()) ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
