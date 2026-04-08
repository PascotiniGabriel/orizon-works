"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAgent, type AgentType } from "@/actions/sector";

// ─── Tipos de agente disponíveis ──────────────────────────────────────────────

const AGENT_TYPES: {
  type: AgentType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: "rh",
    label: "RH",
    description: "Dúvidas de colaboradores, políticas internas e recrutamento",
    icon: "👥",
  },
  {
    type: "marketing",
    label: "Marketing",
    description: "Conteúdo, campanhas, branding e comunicação externa",
    icon: "📣",
  },
  {
    type: "comercial",
    label: "Comercial",
    description: "Propostas, objeções, follow-up e processos de vendas",
    icon: "💼",
  },
  {
    type: "financeiro",
    label: "Financeiro",
    description: "Relatórios, cobranças, conciliação e gestão financeira",
    icon: "📊",
  },
  {
    type: "administrativo",
    label: "Administrativo",
    description: "Processos internos, documentos e rotinas operacionais",
    icon: "🗂️",
  },
];

// ─── Avatares (DiceBear bottts-neutral via API pública) ───────────────────────

const AVATAR_SEEDS = [
  "orizon-a1",
  "orizon-b2",
  "orizon-c3",
  "orizon-d4",
  "orizon-e5",
  "orizon-f6",
  "orizon-g7",
  "orizon-h8",
];

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── Mensagens iniciais por tipo ──────────────────────────────────────────────

const INITIAL_MESSAGES: Record<AgentType, string> = {
  rh: "Olá! Vou configurar seu agente de RH. Para começar: quais são as principais responsabilidades do setor de RH na sua empresa? (ex: recrutamento, folha de pagamento, treinamentos, benefícios)",
  marketing:
    "Olá! Vou configurar seu agente de Marketing. Para começar: quais são as principais atividades de marketing da sua empresa? (ex: redes sociais, conteúdo, campanhas, SEO)",
  comercial:
    "Olá! Vou configurar seu agente Comercial. Para começar: como é o processo de vendas da sua empresa? Quais são as principais etapas desde a prospecção até o fechamento?",
  financeiro:
    "Olá! Vou configurar seu agente Financeiro. Para começar: quais são as principais atividades financeiras que esse agente deve conhecer? (ex: contas a pagar/receber, conciliação, relatórios)",
  administrativo:
    "Olá! Vou configurar seu agente Administrativo. Para começar: quais são as principais responsabilidades administrativas da sua empresa? (ex: contratos, fornecedores, documentos, agenda)",
};

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Step = "select" | "avatar" | "chat";

// ─── Componente principal ─────────────────────────────────────────────────────

export function SectorOnboarding() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<AgentType | null>(null);
  const [customName, setCustomName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_SEEDS[0]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [, startRedirectTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // ── Etapa 1 → 2: tipo + nome ──────────────────────────────────────────────

  function handleTypeConfirm() {
    if (!selectedType) return;
    setStep("avatar");
  }

  // ── Etapa 2 → 3: avatar → criar agente → iniciar chat ────────────────────

  function handleAvatarConfirm() {
    if (!selectedType) return;
    startCreateTransition(async () => {
      const result = await createAgent(
        selectedType,
        customName,
        avatarUrl(selectedAvatar)
      );
      if (!result.success || !result.agentId) {
        alert("Erro ao criar o agente. Tente novamente.");
        return;
      }
      setAgentId(result.agentId);
      setMessages([
        { role: "assistant", content: INITIAL_MESSAGES[selectedType] },
      ]);
      setStep("chat");
    });
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || done || !agentId || !selectedType) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/onboarding/setor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentType: selectedType,
          messages: newMessages,
        }),
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

      if (full.includes("AGENT_BRIEFING_COMPLETO")) {
        setDone(true);
        setTimeout(() => {
          startRedirectTransition(() => router.push("/escritorio"));
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

  const visibleMessages = messages.map((m) => ({
    ...m,
    content: m.content.replace(/AGENT_BRIEFING_COMPLETO[\s\S]*/g, "").trim(),
  })).filter((m) => m.content.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === "select") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0D1B2A" }}>
            Escolha o tipo do seu primeiro agente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Você pode criar mais agentes depois. Comece pelo setor mais estratégico da sua empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_TYPES.map((at) => (
            <button
              key={at.type}
              onClick={() => setSelectedType(at.type)}
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                selectedType === at.type
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <span className="text-2xl">{at.icon}</span>
              <span className="font-semibold text-gray-900">{at.label}</span>
              <span className="text-xs text-gray-500 leading-relaxed">{at.description}</span>
            </button>
          ))}
        </div>

        {selectedType && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="text-sm font-medium text-gray-700">
              Nome personalizado do agente{" "}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Ex: Ana — Assistente de ${
                AGENT_TYPES.find((a) => a.type === selectedType)?.label ?? "RH"
              }`}
              className="bg-white"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              Se deixar em branco, o agente usará apenas o nome do setor.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleTypeConfirm}
            disabled={!selectedType}
            className="font-semibold text-white"
            style={{ backgroundColor: "#E8A020" }}
          >
            Continuar →
          </Button>
        </div>
      </div>
    );
  }

  if (step === "avatar") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0D1B2A" }}>
            Escolha o avatar do agente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione a aparência que melhor representa{" "}
            <strong>
              {customName || AGENT_TYPES.find((a) => a.type === selectedType)?.label}
            </strong>
            .
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {AVATAR_SEEDS.map((seed) => (
            <button
              key={seed}
              onClick={() => setSelectedAvatar(seed)}
              className={`relative flex items-center justify-center rounded-xl border-2 p-1 transition-all ${
                selectedAvatar === seed
                  ? "border-amber-400 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl(seed)}
                alt={`Avatar ${seed}`}
                className="h-14 w-14 rounded-lg"
              />
              {selectedAvatar === seed && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white text-xs font-bold">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl(selectedAvatar)}
            alt="Avatar selecionado"
            className="h-16 w-16 rounded-xl border border-gray-200"
          />
          <div>
            <p className="font-semibold text-gray-900">
              {customName ||
                AGENT_TYPES.find((a) => a.type === selectedType)?.label}
            </p>
            <p className="text-sm text-gray-500">
              Agente de {AGENT_TYPES.find((a) => a.type === selectedType)?.label}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep("select")}
          >
            ← Voltar
          </Button>
          <Button
            onClick={handleAvatarConfirm}
            disabled={isCreating}
            className="font-semibold text-white"
            style={{ backgroundColor: "#E8A020" }}
          >
            {isCreating ? "Criando agente..." : "Iniciar configuração →"}
          </Button>
        </div>
      </div>
    );
  }

  // step === "chat"
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm" style={{ height: "calc(100vh - 300px)", minHeight: "420px" }}>
      {/* Header do chat */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl(selectedAvatar)}
          alt="Avatar"
          className="h-9 w-9 rounded-lg border border-gray-200"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {customName || AGENT_TYPES.find((a) => a.type === selectedType)?.label}
          </p>
          <p className="text-xs text-gray-400">
            Configuração do agente de {AGENT_TYPES.find((a) => a.type === selectedType)?.label}
          </p>
        </div>
        <div className="ml-auto rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          Camada 2 de 2
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-white"
                  : "bg-gray-50 text-gray-800 border"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#E8A020" } : undefined}
            >
              {msg.content}
              {msg.role === "assistant" &&
                streaming &&
                i === visibleMessages.length - 1 && (
                  <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
                )}
            </div>
          </div>
        ))}
        {done && (
          <div className="flex justify-center">
            <div className="rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800 font-medium">
              Agente configurado! Redirecionando para o escritório...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 items-center">
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
  );
}
