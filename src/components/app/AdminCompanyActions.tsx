"use client";

import { useState, useTransition } from "react";
import { adminSetCompanyPlan, adminAddTokens, adminSetSubscriptionStatus } from "@/actions/admin";
import { Settings, Plus, CheckCircle2, AlertCircle } from "lucide-react";

interface AdminCompanyActionsProps {
  companyId: string;
  currentPlan: string;
  currentStatus: string;
  currentTokenLimit: number;
  currentMaxAgents: number;
}

const PLANS = ["trial", "starter", "growth", "business", "enterprise"];
const STATUSES = ["trialing", "active", "past_due", "canceled", "unpaid"];
const PLAN_TOKENS: Record<string, number> = {
  trial: 250_000,
  starter: 1_500_000,
  growth: 5_000_000,
  business: 12_000_000,
  enterprise: 50_000_000,
};
const PLAN_AGENTS: Record<string, number> = {
  trial: 5,
  starter: 1,
  growth: 3,
  business: 5,
  enterprise: 10,
};

function StatusFeedback({ status }: { status: "success" | "error" | null }) {
  if (!status) return null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      {status === "success"
        ? <CheckCircle2 style={{ width: "13px", height: "13px", color: "#10B981" }} strokeWidth={2} />
        : <AlertCircle style={{ width: "13px", height: "13px", color: "#F87171" }} strokeWidth={2} />
      }
      <span style={{ fontSize: "12px", color: status === "success" ? "#10B981" : "#F87171" }}>
        {status === "success" ? "Salvo" : "Erro"}
      </span>
    </span>
  );
}

export function AdminCompanyActions({ companyId, currentPlan, currentStatus, currentTokenLimit, currentMaxAgents }: AdminCompanyActionsProps) {
  const [open, setOpen] = useState(false);
  const [planPending, startPlanTransition] = useTransition();
  const [tokenPending, startTokenTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const [planStatus, setPlanStatus] = useState<"success" | "error" | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"success" | "error" | null>(null);
  const [statusStatus, setStatusStatus] = useState<"success" | "error" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [tokensToAdd, setTokensToAdd] = useState("1000000");

  function handlePlanSave() {
    const tokens = PLAN_TOKENS[selectedPlan] ?? currentTokenLimit;
    const agents = PLAN_AGENTS[selectedPlan] ?? currentMaxAgents;
    setPlanStatus(null);
    startPlanTransition(async () => {
      const res = await adminSetCompanyPlan(companyId, selectedPlan, tokens, agents);
      setPlanStatus(res.success ? "success" : "error");
      setTimeout(() => setPlanStatus(null), 3000);
    });
  }

  function handleAddTokens() {
    const n = parseInt(tokensToAdd, 10);
    if (isNaN(n) || n <= 0) return;
    setTokenStatus(null);
    startTokenTransition(async () => {
      const res = await adminAddTokens(companyId, n);
      setTokenStatus(res.success ? "success" : "error");
      setTimeout(() => setTokenStatus(null), 3000);
    });
  }

  function handleStatusSave() {
    setStatusStatus(null);
    startStatusTransition(async () => {
      const res = await adminSetSubscriptionStatus(companyId, selectedStatus);
      setStatusStatus(res.success ? "success" : "error");
      setTimeout(() => setStatusStatus(null), 3000);
    });
  }

  const selStyle: React.CSSProperties = {
    height: "30px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "#EBEBEB", fontSize: "12px",
    padding: "0 8px", cursor: "pointer", fontFamily: "inherit",
  };

  const btnStyle = (pending: boolean): React.CSSProperties => ({
    height: "30px", padding: "0 12px", borderRadius: "5px", border: "none",
    background: "#10B981", color: "#000", fontWeight: 700, fontSize: "12px",
    cursor: pending ? "wait" : "pointer", opacity: pending ? 0.6 : 1,
    whiteSpace: "nowrap",
  });

  return (
    <td style={{ padding: "0 8px" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Ações admin"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "28px", height: "28px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)",
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          color: open ? "#EBEBEB" : "#555", cursor: "pointer", transition: "all 0.12s",
        }}
      >
        <Settings style={{ width: "13px", height: "13px" }} strokeWidth={2} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: "16px", zIndex: 50,
          background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px", padding: "16px", minWidth: "300px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <p style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>
            Ações Admin
          </p>

          {/* Plan */}
          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Plano</p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} style={selStyle}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={handlePlanSave} disabled={planPending} style={btnStyle(planPending)}>Salvar</button>
              <StatusFeedback status={planStatus} />
            </div>
            <p style={{ color: "#3A3A3A", fontSize: "11px", marginTop: "4px" }}>
              Tokens: {(PLAN_TOKENS[selectedPlan] ?? currentTokenLimit).toLocaleString("pt-BR")} · Agentes: {PLAN_AGENTS[selectedPlan] ?? currentMaxAgents}
            </p>
          </div>

          {/* Tokens */}
          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Adicionar tokens</p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                value={tokensToAdd}
                onChange={(e) => setTokensToAdd(e.target.value)}
                style={{ ...selStyle, width: "130px" }}
                min="1"
                max="100000000"
              />
              <button onClick={handleAddTokens} disabled={tokenPending} style={btnStyle(tokenPending)}>
                <Plus style={{ width: "12px", height: "12px", display: "inline", marginRight: "4px" }} strokeWidth={2.5} />
                Adicionar
              </button>
              <StatusFeedback status={tokenStatus} />
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Status da assinatura</p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={selStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleStatusSave} disabled={statusPending} style={btnStyle(statusPending)}>Salvar</button>
              <StatusFeedback status={statusStatus} />
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{ marginTop: "4px", background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer" }}
          >
            Fechar
          </button>
        </div>
      )}
    </td>
  );
}
