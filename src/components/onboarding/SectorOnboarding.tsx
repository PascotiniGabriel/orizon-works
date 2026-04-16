"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAgent, type AgentType } from "@/actions/sector";

// ─── Tipos de agente disponíveis ──────────────────────────────────────────────

const AGENT_TYPES: {
  type: AgentType;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  { type: "rh", label: "RH", description: "Dúvidas de colaboradores, políticas internas e recrutamento", icon: "👥", color: "#A78BFA" },
  { type: "marketing", label: "Marketing", description: "Conteúdo, campanhas, branding e comunicação externa", icon: "📣", color: "#FB7185" },
  { type: "comercial", label: "Comercial", description: "Propostas, objeções, follow-up e processos de vendas", icon: "💼", color: "#60A5FA" },
  { type: "financeiro", label: "Financeiro", description: "Relatórios, cobranças, conciliação e gestão financeira", icon: "📊", color: "#10B981" },
  { type: "administrativo", label: "Administrativo", description: "Processos internos, documentos e rotinas operacionais", icon: "🗂️", color: "#FBBF24" },
];

// ─── Avatares ─────────────────────────────────────────────────────────────────

const AVATAR_SEEDS = [
  "orizon-a1", "orizon-b2", "orizon-c3", "orizon-d4",
  "orizon-e5", "orizon-f6", "orizon-g7", "orizon-h8",
];

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── Mensagens iniciais por tipo ──────────────────────────────────────────────

const INITIAL_MESSAGES: Record<AgentType, string> = {
  rh: "Olá! Vou configurar seu agente de RH. Para começar: quais são as principais responsabilidades do setor de RH na sua empresa? (ex: recrutamento, folha de pagamento, treinamentos, benefícios)",
  marketing: "Olá! Vou configurar seu agente de Marketing. Para começar: quais são as principais atividades de marketing da sua empresa? (ex: redes sociais, conteúdo, campanhas, SEO)",
  comercial: "Olá! Vou configurar seu agente Comercial. Para começar: como é o processo de vendas da sua empresa? Quais são as principais etapas desde a prospecção até o fechamento?",
  financeiro: "Olá! Vou configurar seu agente Financeiro. Para começar: quais são as principais atividades financeiras que esse agente deve conhecer? (ex: contas a pagar/receber, conciliação, relatórios)",
  administrativo: "Olá! Vou configurar seu agente Administrativo. Para começar: quais são as principais responsabilidades administrativas da sua empresa? (ex: contratos, fornecedores, documentos, agenda)",
};

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Step = "select" | "avatar" | "chat";

// ─── Componente principal ─────────────────────────────────────────────────────

interface SectorOnboardingProps {
  existingTypes?: AgentType[];
}

export function SectorOnboarding({ existingTypes = [] }: SectorOnboardingProps) {
  const router = useRouter();

  const availableTypes = AGENT_TYPES.filter((a) => !existingTypes.includes(a.type));

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
      const result = await createAgent(selectedType, customName, avatarUrl(selectedAvatar));
      if (!result.success || !result.agentId) {
        alert("Erro ao criar o agente. Tente novamente.");
        return;
      }
      setAgentId(result.agentId);
      setMessages([{ role: "assistant", content: INITIAL_MESSAGES[selectedType] }]);
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
        body: JSON.stringify({ agentId, agentType: selectedType, messages: newMessages }),
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

  const visibleMessages = messages
    .map((m) => ({ ...m, content: m.content.replace(/AGENT_BRIEFING_COMPLETO[\s\S]*/g, "").trim() }))
    .filter((m) => m.content.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === "select") {
    const selectedInfo = AGENT_TYPES.find((a) => a.type === selectedType);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#EBEBEB" }}>
            Escolha o tipo do seu primeiro agente
          </h2>
          <p style={{ marginTop: "6px", fontSize: "13px", color: "#555" }}>
            Você pode criar mais agentes depois. Comece pelo setor mais estratégico da sua empresa.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {availableTypes.map((at) => {
            const active = selectedType === at.type;
            return (
              <button
                key={at.type}
                onClick={() => setSelectedType(at.type)}
                style={{
                  display: "flex", flexDirection: "column", gap: "8px",
                  borderRadius: "8px", padding: "14px",
                  border: active ? `1px solid ${at.color}40` : "1px solid rgba(255,255,255,0.07)",
                  background: active ? `${at.color}0D` : "rgba(255,255,255,0.02)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                  }
                }}
              >
                <span style={{ fontSize: "22px" }}>{at.icon}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: active ? at.color : "#EBEBEB" }}>{at.label}</span>
                <span style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>{at.description}</span>
              </button>
            );
          })}
        </div>

        {selectedType && (
          <div style={{
            display: "flex", flexDirection: "column", gap: "10px",
            borderRadius: "8px", padding: "16px",
            border: `1px solid ${selectedInfo?.color ?? "#10B981"}20`,
            background: `${selectedInfo?.color ?? "#10B981"}08`,
          }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#888" }}>
              Nome personalizado do agente{" "}
              <span style={{ color: "#3A3A3A", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Ex: Ana — Assistente de ${selectedInfo?.label ?? "RH"}`}
              maxLength={100}
              style={{
                height: "34px", borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                color: "#EBEBEB", fontSize: "14px", padding: "0 12px",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${selectedInfo?.color ?? "#10B981"}60`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            <p style={{ fontSize: "12px", color: "#3A3A3A" }}>
              Se deixar em branco, o agente usará apenas o nome do setor.
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleTypeConfirm}
            disabled={!selectedType}
            style={{
              height: "36px", padding: "0 20px", borderRadius: "6px",
              background: "#10B981", color: "#000", fontWeight: 700, fontSize: "13px",
              border: "none", cursor: selectedType ? "pointer" : "not-allowed",
              opacity: selectedType ? 1 : 0.35, transition: "opacity 0.15s",
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  if (step === "avatar") {
    const agentLabel = customName || AGENT_TYPES.find((a) => a.type === selectedType)?.label;
    const sectorLabel = AGENT_TYPES.find((a) => a.type === selectedType)?.label;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#EBEBEB" }}>
            Escolha o avatar do agente
          </h2>
          <p style={{ marginTop: "6px", fontSize: "13px", color: "#555" }}>
            Selecione a aparência que melhor representa <strong style={{ color: "#888" }}>{agentLabel}</strong>.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "10px" }}>
          {AVATAR_SEEDS.map((seed) => {
            const active = selectedAvatar === seed;
            return (
              <button
                key={seed}
                onClick={() => setSelectedAvatar(seed)}
                style={{
                  position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "10px", padding: "4px", cursor: "pointer",
                  border: active ? "2px solid #10B981" : "2px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(seed)} alt={`Avatar ${seed}`} style={{ width: "52px", height: "52px", borderRadius: "8px" }} />
                {active && (
                  <span style={{
                    position: "absolute", top: "-7px", right: "-7px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "#10B981", color: "#000", fontSize: "9px", fontWeight: 800,
                  }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "14px",
          borderRadius: "8px", padding: "14px",
          border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(selectedAvatar)} alt="Avatar selecionado" style={{ width: "52px", height: "52px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#EBEBEB" }}>{agentLabel}</p>
            <p style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Agente de {sectorLabel}</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => setStep("select")}
            style={{
              height: "36px", padding: "0 16px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "#888", fontSize: "13px", cursor: "pointer", transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            ← Voltar
          </button>
          <button
            onClick={handleAvatarConfirm}
            disabled={isCreating}
            style={{
              height: "36px", padding: "0 20px", borderRadius: "6px",
              background: "#10B981", color: "#000", fontWeight: 700, fontSize: "13px",
              border: "none", cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.6 : 1, transition: "opacity 0.15s",
            }}
          >
            {isCreating ? "Criando agente..." : "Iniciar configuração →"}
          </button>
        </div>
      </div>
    );
  }

  // step === "chat"
  const agentLabel = customName || AGENT_TYPES.find((a) => a.type === selectedType)?.label;
  const sectorLabel = AGENT_TYPES.find((a) => a.type === selectedType)?.label;

  return (
    <div style={{
      display: "flex", flexDirection: "column", overflow: "hidden",
      borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
      background: "#111111", height: "500px", minHeight: "420px",
    }}>
      {/* Header do chat */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl(selectedAvatar)} alt="Avatar" style={{ width: "34px", height: "34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#EBEBEB" }}>{agentLabel}</p>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>Configuração do agente de {sectorLabel}</p>
        </div>
        <div style={{
          marginLeft: "auto", borderRadius: "999px",
          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
          padding: "3px 10px", fontSize: "11px", fontWeight: 600, color: "#10B981",
        }}>
          Camada 2 de 2
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {visibleMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", borderRadius: "14px", padding: "10px 14px",
              fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap",
              ...(msg.role === "user"
                ? { background: "#10B981", color: "#000", fontWeight: 500 }
                : { background: "rgba(255,255,255,0.04)", color: "#EBEBEB", border: "1px solid rgba(255,255,255,0.07)" }
              ),
            }}>
              {msg.content}
              {msg.role === "assistant" && streaming && i === visibleMessages.length - 1 && (
                <span style={{ marginLeft: "4px", display: "inline-block", width: "2px", height: "12px", background: "#555", animation: "pulse 1s infinite" }} />
              )}
            </div>
          </div>
        ))}
        {done && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              borderRadius: "999px", background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)", padding: "8px 18px",
              fontSize: "13px", color: "#10B981", fontWeight: 500,
            }}>
              Agente configurado! Redirecionando para o escritório...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
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
  );
}
