"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";

const INPUT: React.CSSProperties = {
  width: "100%",
  height: "40px",
  background: "#1A1A1A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "0 12px",
  color: "#EBEBEB",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const LABEL: React.CSSProperties = {
  display: "block",
  color: "#666",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "6px",
};

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [showPw, setShowPw] = useState(false);

  return (
    <div>
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div
          style={{
            width: "24px",
            height: "24px",
            background: "#10B981",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#000", fontSize: "11px", fontWeight: 800 }}>O</span>
        </div>
        <span style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Orizon Works
        </span>
      </div>

      <h1
        style={{
          color: "#EBEBEB",
          fontSize: "22px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          marginBottom: "6px",
        }}
      >
        Bem-vindo de volta
      </h1>
      <p style={{ color: "#555", fontSize: "13px", marginBottom: "28px" }}>
        Acesse sua conta para continuar
      </p>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* E-mail */}
        <div>
          <label style={LABEL}>E-mail</label>
          <input
            name="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            style={INPUT}
          />
          {state?.success === false && state.errors?.email && (
            <p style={{ color: "#F87171", fontSize: "11px", marginTop: "4px" }}>
              {state.errors.email[0]}
            </p>
          )}
        </div>

        {/* Senha */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ ...LABEL, marginBottom: 0 }}>Senha</label>
            <Link
              href="/recuperar-senha"
              style={{ color: "#10B981", fontSize: "12px", textDecoration: "none" }}
            >
              Esqueci a senha
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{ ...INPUT, paddingRight: "40px" }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#555",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPw ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {state?.success === false && state.errors?.password && (
            <p style={{ color: "#F87171", fontSize: "11px", marginTop: "4px" }}>
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {/* Error global */}
        {state?.success === false && state.message && (
          <div
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.15)",
              borderRadius: "6px",
              padding: "10px 12px",
              color: "#F87171",
              fontSize: "12px",
            }}
          >
            {state.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            height: "40px",
            background: pending ? "rgba(16,185,129,0.6)" : "#10B981",
            color: "#000",
            fontWeight: 600,
            fontSize: "13px",
            border: "none",
            borderRadius: "6px",
            cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
            transition: "opacity 0.15s",
          }}
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ color: "#444", fontSize: "12px", textAlign: "center", marginTop: "24px" }}>
        Não tem conta?{" "}
        <Link href="/cadastro" style={{ color: "#10B981", fontWeight: 500, textDecoration: "none" }}>
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
