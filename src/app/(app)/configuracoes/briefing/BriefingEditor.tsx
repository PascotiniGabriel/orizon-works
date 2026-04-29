"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateCompanyBriefing, updateAgentBriefing } from "@/actions/briefings";
import type { CompanyBriefingInput, AgentBriefingInput } from "@/actions/briefings";
import { CheckCircle2, AlertCircle, ChevronDown, HelpCircle } from "lucide-react";

interface CompanyBriefingData {
  companyName: string | null;
  segment: string | null;
  mission: string | null;
  values: string | null;
  communicationTone: string | null;
  targetAudience: string | null;
  mainProducts: string | null;
  additionalContext: string | null;
}

interface AgentBriefingData {
  agentId: string;
  agentType: string;
  agentLabel: string;
  customName: string | null;
  sectorContext: string | null;
  specificInstructions: string | null;
  restrictedTopics: string | null;
  preferredExamples: string | null;
  isComplete: boolean;
}

interface BriefingEditorProps {
  companyBriefing: CompanyBriefingData | null;
  agentBriefings: AgentBriefingData[];
  canEditCompany: boolean;
}

const FIELD_STYLES: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  color: "#EBEBEB",
  fontSize: "14px",
  padding: "9px 12px",
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  minHeight: "72px",
  lineHeight: 1.5,
  transition: "border-color 0.15s",
};

const LABEL_STYLES: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "6px",
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

function companyCompleteness(data: CompanyBriefingData | null): number {
  if (!data) return 0;
  const fields = [data.companyName, data.segment, data.mission, data.values, data.communicationTone, data.targetAudience, data.mainProducts, data.additionalContext];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

function agentCompleteness(agent: AgentBriefingData): number {
  const fields = [agent.sectorContext, agent.specificInstructions, agent.restrictedTopics, agent.preferredExamples];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

function CompletenessBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.4s ease" }} />
      </div>
      <span style={{ color, fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="ow-tooltip" style={{ cursor: "help" }}>
      <HelpCircle style={{ width: "12px", height: "12px", color: "#3A3A3A" }} strokeWidth={2} />
      <span className="ow-tooltip-content">{text}</span>
    </span>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={LABEL_STYLES}>
        {label}
        {hint && <Tooltip text={hint} />}
      </label>
      {children}
    </div>
  );
}

function SaveButton({ pending, disabled }: { pending: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      style={{
        height: "36px", padding: "0 20px", borderRadius: "6px",
        background: "#10B981", color: "#000", fontWeight: 700, fontSize: "13px",
        border: "none", cursor: pending ? "wait" : "pointer",
        opacity: (pending || disabled) ? 0.6 : 1, transition: "opacity 0.15s",
      }}
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

function StatusMsg({ status }: { status: "success" | "error" | null }) {
  if (!status) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "8px 12px", borderRadius: "6px",
      background: status === "success" ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.08)",
      border: `1px solid ${status === "success" ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.2)"}`,
    }}>
      {status === "success"
        ? <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10B981", flexShrink: 0 }} strokeWidth={2} />
        : <AlertCircle style={{ width: "14px", height: "14px", color: "#F87171", flexShrink: 0 }} strokeWidth={2} />
      }
      <span style={{ fontSize: "13px", color: status === "success" ? "#10B981" : "#F87171" }}>
        {status === "success" ? "Salvo com sucesso." : "Erro ao salvar. Tente novamente."}
      </span>
    </div>
  );
}

function AgentSaveToast({ agentId }: { agentId: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 12px", borderRadius: "6px",
      background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
    }}>
      <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10B981", flexShrink: 0 }} strokeWidth={2} />
      <span style={{ fontSize: "13px", color: "#10B981" }}>Salvo com sucesso.</span>
      <Link
        href={`/escritorio/chat/${agentId}`}
        style={{ fontSize: "13px", color: "#10B981", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}
      >
        Testar agente agora →
      </Link>
    </div>
  );
}

function CompanyBriefingForm({ data }: { data: CompanyBriefingData | null }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [pct, setPct] = useState(companyCompleteness(data));

  const d: CompanyBriefingData = data ?? {
    companyName: null, segment: null, mission: null, values: null,
    communicationTone: null, targetAudience: null, mainProducts: null, additionalContext: null,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: CompanyBriefingInput = {
      companyName: fd.get("companyName") as string ?? "",
      segment: fd.get("segment") as string ?? "",
      mission: fd.get("mission") as string ?? "",
      values: fd.get("values") as string ?? "",
      communicationTone: fd.get("communicationTone") as string ?? "",
      targetAudience: fd.get("targetAudience") as string ?? "",
      mainProducts: fd.get("mainProducts") as string ?? "",
      additionalContext: fd.get("additionalContext") as string ?? "",
    };
    setStatus(null);
    startTransition(async () => {
      const res = await updateCompanyBriefing(input);
      if (res.success) {
        setPct(companyCompleteness(input as unknown as CompanyBriefingData));
      }
      setStatus(res.success ? "success" : "error");
      setTimeout(() => setStatus(null), 4000);
    });
  }

  const ta = (name: string, defaultValue: string | null | undefined, rows = 3) => (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      rows={rows}
      style={FIELD_STYLES}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
    />
  );

  const inp = (name: string, defaultValue: string | null | undefined) => (
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
      style={{ ...FIELD_STYLES, minHeight: "unset", height: "38px", resize: "none" }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
    />
  );

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <CompletenessBar pct={pct} />
        <p style={{ color: "#444", fontSize: "12px", marginTop: "6px" }}>
          {pct === 100 ? "Briefing completo!" : `${pct}% preenchido — preencha todos os campos para melhores resultados.`}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <FieldGroup label="Nome da empresa" hint="Nome oficial ou nome de mercado da empresa. Ex: 'Distribuidora Podal Ltda'">
            {inp("companyName", d.companyName)}
          </FieldGroup>
          <FieldGroup label="Segmento / setor de atuação" hint="Ex: 'Distribuição de bebidas B2B', 'Consultoria de RH', 'Software SaaS para varejo'">
            {inp("segment", d.segment)}
          </FieldGroup>
        </div>

        <FieldGroup label="Missão" hint="Ex: 'Conectar empresas brasileiras aos melhores talentos do mercado, com agilidade e precisão'">
          {ta("mission", d.mission)}
        </FieldGroup>

        <FieldGroup label="Valores" hint="Liste de 3 a 5 valores. Ex: 'Inovação, Transparência, Foco no cliente, Resultados com ética'">
          {ta("values", d.values)}
        </FieldGroup>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <FieldGroup label="Tom de comunicação" hint="Ex: 'Formal e técnico com clientes externos, descontraído internamente'">
            {inp("communicationTone", d.communicationTone)}
          </FieldGroup>
          <FieldGroup label="Público-alvo" hint="Ex: 'Gerentes de compras de supermercados com 20+ funcionários no Sul do Brasil'">
            {inp("targetAudience", d.targetAudience)}
          </FieldGroup>
        </div>

        <FieldGroup label="Produtos / Serviços principais" hint="Liste os principais produtos ou serviços que a empresa oferece, com breve descrição de cada um">
          {ta("mainProducts", d.mainProducts)}
        </FieldGroup>

        <FieldGroup label="Contexto adicional" hint="Informações extras: particularidades da operação, concorrentes, sazonalidade, linguagem interna, etc.">
          {ta("additionalContext", d.additionalContext, 5)}
        </FieldGroup>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <SaveButton pending={pending} />
          <StatusMsg status={status} />
        </div>
      </form>
    </div>
  );
}

function AgentBriefingForm({ agent }: { agent: AgentBriefingData }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [open, setOpen] = useState(!agent.isComplete);
  const [pct, setPct] = useState(agentCompleteness(agent));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: AgentBriefingInput = {
      customName: fd.get("customName") as string ?? "",
      sectorContext: fd.get("sectorContext") as string ?? "",
      specificInstructions: fd.get("specificInstructions") as string ?? "",
      restrictedTopics: fd.get("restrictedTopics") as string ?? "",
      preferredExamples: fd.get("preferredExamples") as string ?? "",
    };
    setStatus(null);
    startTransition(async () => {
      const res = await updateAgentBriefing(agent.agentId, input);
      if (res.success) {
        setPct(agentCompleteness({ ...agent, ...input }));
      }
      setStatus(res.success ? "success" : "error");
      setTimeout(() => setStatus(null), 5000);
    });
  }

  const ta = (name: string, defaultValue: string | null | undefined, rows = 3) => (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      rows={rows}
      style={FIELD_STYLES}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
    />
  );

  return (
    <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", gap: "12px" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: open ? "8px" : 0 }}>
            <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600 }}>
              {agent.customName ? `${agent.customName}` : agent.agentLabel}
            </span>
            <span style={{ color: "#555", fontSize: "13px" }}>{agent.agentLabel}</span>
            {!agent.isComplete && (
              <span style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24", fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Incompleto
              </span>
            )}
          </div>
          {open && <CompletenessBar pct={pct} />}
        </div>
        <ChevronDown style={{ width: "15px", height: "15px", color: "#555", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} strokeWidth={2} />
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "20px" }}>
            <FieldGroup label="Nome personalizado do agente" hint="Ex: Sofia (RH), Max (Comercial) — personalize para criar identidade com a equipe">
              <input
                name="customName"
                defaultValue={agent.customName ?? ""}
                placeholder={agent.agentLabel}
                style={{ ...FIELD_STYLES, minHeight: "unset", height: "38px", resize: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
            </FieldGroup>

            <FieldGroup label="Contexto do setor" hint="Descreva o que este agente faz: responsabilidades, KPIs monitorados e processos do setor. Quanto mais detalhe, melhores as respostas.">
              {ta("sectorContext", agent.sectorContext, 4)}
            </FieldGroup>

            <FieldGroup label="Instruções específicas" hint="Como o agente deve se comportar: tom, formato de resposta, quando pedir mais informações, quais análises fazer antes de responder.">
              {ta("specificInstructions", agent.specificInstructions, 4)}
            </FieldGroup>

            <FieldGroup label="Tópicos restritos" hint="Assuntos que este agente NÃO deve abordar. Ex: 'Não discuta valores de salários', 'Não tome decisões de demissão'">
              {ta("restrictedTopics", agent.restrictedTopics)}
            </FieldGroup>

            <FieldGroup label="Exemplos de uso" hint="Liste situações reais comuns para este agente. Ex: 'Analise este currículo para a vaga de analista sênior', 'Elabore proposta para cliente do segmento varejo'">
              {ta("preferredExamples", agent.preferredExamples)}
            </FieldGroup>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <SaveButton pending={pending} />
              {status === "success" ? (
                <AgentSaveToast agentId={agent.agentId} />
              ) : (
                <StatusMsg status={status} />
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function BriefingEditor({ companyBriefing, agentBriefings, canEditCompany }: BriefingEditorProps) {
  const [activeTab, setActiveTab] = useState<"empresa" | "agentes">("empresa");

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "4px", width: "fit-content" }}>
        {(["empresa", "agentes"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              height: "32px", padding: "0 16px", borderRadius: "6px", border: "none", cursor: "pointer",
              background: activeTab === tab ? "#10B981" : "transparent",
              color: activeTab === tab ? "#000" : "#888",
              fontWeight: activeTab === tab ? 700 : 400, fontSize: "13px",
              transition: "all 0.15s",
            }}
          >
            {tab === "empresa" ? "Empresa" : "Agentes"}
          </button>
        ))}
      </div>

      {activeTab === "empresa" && (
        <div>
          {canEditCompany ? (
            <CompanyBriefingForm data={companyBriefing} />
          ) : (
            <p style={{ color: "#555", fontSize: "14px" }}>Apenas admins podem editar o briefing da empresa.</p>
          )}
        </div>
      )}

      {activeTab === "agentes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {agentBriefings.length === 0 ? (
            <p style={{ color: "#555", fontSize: "14px" }}>Nenhum agente criado ainda.</p>
          ) : (
            agentBriefings.map((agent) => (
              <AgentBriefingForm key={agent.agentId} agent={agent} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
