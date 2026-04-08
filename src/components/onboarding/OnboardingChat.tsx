"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingProgress } from "./OnboardingProgress";
import { DocumentUpload } from "./DocumentUpload";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const COMPLETED_FIELDS_MAP: Record<string, string> = {
  segment: "Nome e segmento",
  mission: "Missão",
  values: "Valores e cultura",
  communicationTone: "Tom de comunicação",
  targetAudience: "Público-alvo",
  mainProducts: "Produtos e serviços",
};

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

      // Detectar campos coletados na conversa acumulada
      const allText = [...newMessages.map((m) => m.content), full].join(" ").toLowerCase();
      const detected: string[] = [];
      if (allText.includes("segmento") || allText.includes("setor") || allText.includes("área")) {
        detected.push("segment");
      }
      if (allText.includes("missão") || allText.includes("propósito")) {
        detected.push("mission");
      }
      if (allText.includes("valores") || allText.includes("cultura")) {
        detected.push("values");
      }
      if (allText.includes("tom") || allText.includes("comunicação")) {
        detected.push("communicationTone");
      }
      if (allText.includes("público") || allText.includes("cliente")) {
        detected.push("targetAudience");
      }
      if (allText.includes("produto") || allText.includes("serviço")) {
        detected.push("mainProducts");
      }
      setCompletedFields([...new Set(detected)]);

      // Detectar conclusão → avança para Camada 2 (briefing de setor)
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
    <div className="flex h-full gap-6">
      {/* Sidebar de progresso */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <OnboardingProgress completedFields={completedFields} />
      </aside>

      {/* Chat */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : msg.role === "system"
                  ? "justify-center"
                  : "justify-start"
              }`}
            >
              {msg.role === "system" ? (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                  <span>📎</span>
                  {msg.content}
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white"
                      : "bg-gray-50 text-gray-800 border"
                  }`}
                  style={
                    msg.role === "user" ? { backgroundColor: "#E8A020" } : undefined
                  }
                >
                  {msg.content}
                  {msg.role === "assistant" && streaming && i === visibleMessages.length - 1 && (
                    <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
                  )}
                </div>
              )}
            </div>
          ))}
          {done && (
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800 font-medium">
                Empresa configurada! Avançando para o próximo passo...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2 items-center">
          <DocumentUpload
            onUploaded={handleDocumentUploaded}
            disabled={streaming || done}
          />
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
            disabled={streaming || done}
            className="flex-1"
            autoFocus
          />
          <Button
            onClick={sendMessage}
            disabled={streaming || done || !input.trim()}
            className="shrink-0 font-semibold text-white"
            style={{ backgroundColor: "#E8A020" }}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
