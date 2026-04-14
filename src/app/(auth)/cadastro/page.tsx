"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";

const INPUT: React.CSSProperties = {
  width: "100%", height: "46px",
  background: "#1A1A1A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "7px", padding: "0 14px",
  color: "#EBEBEB", fontSize: "15px",
  outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const LABEL: React.CSSProperties = {
  display: "block", color: "#666",
  fontSize: "14px", fontWeight: 500, marginBottom: "7px",
};

const PLANS = [
  { id: "trial",    label: "Trial grátis",  desc: "7 dias grátis, sem compromisso",        badge: true  },
  { id: "starter",  label: "Starter",        desc: "R$ 197/mês — 1 agente, 5 usuários",     badge: false },
  { id: "growth",   label: "Growth",         desc: "R$ 697/mês — 3 agentes, 15 usuários",   badge: false },
  { id: "business", label: "Business",       desc: "R$ 1.497/mês — 5 agentes, 40 usuários", badge: false },
];

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [showPw, setShowPw] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("trial");

  function fieldError(field: string) {
    if (state?.success === false && state.errors?.[field]) {
      return <p style={{ color: "#F87171", fontSize: "13px", marginTop: "5px" }}>{state.errors[field][0]}</p>;
    }
    return null;
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-6 lg:hidden">
        <div style={{ width: "26px", height: "26px", background: "#10B981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#000", fontSize: "12px", fontWeight: 800 }}>O</span>
        </div>
        <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>Orizon Works</span>
      </div>

      <h1 style={{ color: "#EBEBEB", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "7px" }}>
        Criar conta
      </h1>
      <p style={{ color: "#555", fontSize: "15px", marginBottom: "24px" }}>
        Configure sua empresa em minutos
      </p>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={LABEL}>Seu nome</label>
          <input name="name" placeholder="João Silva" autoComplete="name" required style={INPUT} />
          {fieldError("name")}
        </div>

        <div>
          <label style={LABEL}>Nome da empresa</label>
          <input name="companyName" placeholder="Empresa Ltda" required style={INPUT} />
          {fieldError("companyName")}
        </div>

        <div>
          <label style={LABEL}>E-mail corporativo</label>
          <input name="email" type="email" placeholder="voce@empresa.com" autoComplete="email" required style={INPUT} />
          {fieldError("email")}
        </div>

        <div>
          <label style={LABEL}>Senha</label>
          <div style={{ position: "relative" }}>
            <input name="password" type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" autoComplete="new-password" required style={{ ...INPUT, paddingRight: "44px" }} />
            <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", padding: 0, display: "flex", alignItems: "center" }}>
              {showPw ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {fieldError("password")}
        </div>

        {/* Plano */}
        <div>
          <label style={LABEL}>Plano</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <label key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "7px", border: `1px solid ${selected ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`, background: selected ? "rgba(16,185,129,0.06)" : "#1A1A1A", cursor: "pointer", transition: "all 0.15s" }}>
                  <input type="radio" name="plan" value={plan.id} defaultChecked={plan.id === "trial"} style={{ accentColor: "#10B981", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 500 }}>{plan.label}</span>
                      {plan.badge && (
                        <span style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Grátis
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#555", fontSize: "13px", marginTop: "2px" }}>{plan.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {fieldError("plan")}
        </div>

        {/* Termos */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <input type="checkbox" id="acceptTerms" name="acceptTerms" required style={{ marginTop: "3px", accentColor: "#10B981", flexShrink: 0 }} />
          <label htmlFor="acceptTerms" style={{ color: "#555", fontSize: "14px", lineHeight: "1.55", cursor: "pointer" }}>
            Concordo com os{" "}
            <Link href="/termos" target="_blank" style={{ color: "#10B981", textDecoration: "none" }}>Termos de Uso</Link>{" "}
            e{" "}
            <Link href="/privacidade" target="_blank" style={{ color: "#10B981", textDecoration: "none" }}>Política de Privacidade</Link>
          </label>
        </div>
        {fieldError("acceptTerms")}

        {/* Error global */}
        {state?.success === false && state.message && (
          <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "7px", padding: "12px 14px", color: "#F87171", fontSize: "14px" }}>
            {state.message}
          </div>
        )}

        <button type="submit" disabled={pending}
          style={{ width: "100%", height: "46px", background: pending ? "rgba(16,185,129,0.6)" : "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", border: "none", borderRadius: "7px", cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "opacity 0.15s" }}>
          {pending ? "Criando conta..." : "Criar conta e começar"}
        </button>
      </form>

      <p style={{ color: "#444", fontSize: "14px", textAlign: "center", marginTop: "22px" }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "#10B981", fontWeight: 500, textDecoration: "none" }}>Entrar</Link>
      </p>
    </div>
  );
}
