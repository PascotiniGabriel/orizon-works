"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "44px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "8px",
  padding: "0 14px",
  color: "#F0EDE8",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: "#4C4C64",
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  marginBottom: "7px",
};

const PLANS = [
  { id: "trial",    label: "Trial grátis",  description: "7 dias grátis, sem compromisso",        badge: true  },
  { id: "starter",  label: "Starter",        description: "R$ 197/mês — 1 agente, 5 usuários",     badge: false },
  { id: "growth",   label: "Growth",         description: "R$ 697/mês — 3 agentes, 15 usuários",   badge: false },
  { id: "business", label: "Business",       description: "R$ 1.497/mês — 5 agentes, 40 usuários", badge: false },
];

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("trial");

  function fieldError(field: string) {
    if (state?.success === false && state.errors?.[field]) {
      return (
        <p style={{ color: "#F87171", fontSize: "12px", marginTop: "5px" }}>
          {state.errors[field][0]}
        </p>
      );
    }
    return null;
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-6 lg:hidden">
        <div
          className="flex h-8 w-8 items-center justify-center text-[15px] font-bold"
          style={{
            border: "1.5px solid #E8A020",
            borderRadius: "6px",
            color: "#E8A020",
            background: "rgba(232,160,32,0.07)",
            letterSpacing: "-0.06em",
          }}
        >
          O
        </div>
        <span style={{ color: "#F0EDE8", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.03em" }}>
          Orizon<span style={{ color: "#E8A020" }}>Works</span>
        </span>
      </div>

      <h1 style={{ color: "#F0EDE8", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        Criar conta
      </h1>
      <p style={{ color: "#5A5A72", fontSize: "13px", marginTop: "6px" }}>
        Configure sua empresa em minutos com IA
      </p>

      <form action={action} style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Nome */}
        <div>
          <label style={LABEL_STYLE}>Seu nome</label>
          <input name="name" placeholder="João Silva" autoComplete="name" required style={INPUT_STYLE} />
          {fieldError("name")}
        </div>

        {/* Empresa */}
        <div>
          <label style={LABEL_STYLE}>Nome da empresa</label>
          <input name="companyName" placeholder="Empresa Ltda" required style={INPUT_STYLE} />
          {fieldError("companyName")}
        </div>

        {/* Email */}
        <div>
          <label style={LABEL_STYLE}>E-mail corporativo</label>
          <input name="email" type="email" placeholder="voce@empresa.com" autoComplete="email" required style={INPUT_STYLE} />
          {fieldError("email")}
        </div>

        {/* Senha */}
        <div>
          <label style={LABEL_STYLE}>Senha</label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              style={{ ...INPUT_STYLE, paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#4C4C64",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {fieldError("password")}
        </div>

        {/* Plano */}
        <div>
          <label style={LABEL_STYLE}>Plano</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {PLANS.map((plan) => (
              <label
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${selectedPlan === plan.id ? "rgba(232,160,32,0.4)" : "rgba(255,255,255,0.07)"}`,
                  background: selectedPlan === plan.id ? "rgba(232,160,32,0.06)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  defaultChecked={plan.id === "trial"}
                  style={{ accentColor: "#E8A020" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ color: "#F0EDE8", fontSize: "13px", fontWeight: 500 }}>
                      {plan.label}
                    </span>
                    {plan.badge && (
                      <span style={{
                        background: "rgba(232,160,32,0.15)",
                        color: "#E8A020",
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#4C4C64", fontSize: "11px", marginTop: "1px" }}>
                    {plan.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
          {fieldError("plan")}
        </div>

        {/* Termos */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            required
            style={{ marginTop: "2px", accentColor: "#E8A020", flexShrink: 0 }}
          />
          <label htmlFor="acceptTerms" style={{ color: "#5A5A72", fontSize: "12px", lineHeight: "1.5", cursor: "pointer" }}>
            Concordo com os{" "}
            <Link href="/termos" target="_blank" style={{ color: "#E8A020" }}>
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" target="_blank" style={{ color: "#E8A020" }}>
              Política de Privacidade
            </Link>
          </label>
        </div>
        {fieldError("acceptTerms")}

        {/* Global error */}
        {state?.success === false && state.message && (
          <div style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.18)",
            borderRadius: "8px",
            padding: "11px 14px",
            color: "#F87171",
            fontSize: "13px",
          }}>
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            height: "44px",
            background: pending ? "rgba(232,160,32,0.6)" : "#E8A020",
            color: "#1A0E00",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "-0.01em",
            border: "none",
            borderRadius: "8px",
            cursor: pending ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            fontFamily: "inherit",
          }}
        >
          {pending ? "Criando conta..." : "Criar conta e começar"}
        </button>
      </form>

      <p style={{ color: "#4C4C64", fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "#E8A020", fontWeight: 500 }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
