"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";

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

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
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

      <h1
        style={{
          color: "#F0EDE8",
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}
      >
        Entrar na plataforma
      </h1>
      <p style={{ color: "#5A5A72", fontSize: "13px", marginTop: "6px" }}>
        Digite seu e-mail e senha para acessar
      </p>

      <form action={action} style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Email */}
        <div>
          <label style={LABEL_STYLE}>E-mail</label>
          <input
            name="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            style={INPUT_STYLE}
          />
          {state?.success === false && state.errors?.email && (
            <p style={{ color: "#F87171", fontSize: "12px", marginTop: "5px" }}>
              {state.errors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
            <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Senha</label>
            <Link href="/recuperar-senha" style={{ color: "#E8A020", fontSize: "12px" }}>
              Esqueci a senha
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
          {state?.success === false && state.errors?.password && (
            <p style={{ color: "#F87171", fontSize: "12px", marginTop: "5px" }}>
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {/* Global error */}
        {state?.success === false && state.message && (
          <div
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.18)",
              borderRadius: "8px",
              padding: "11px 14px",
              color: "#F87171",
              fontSize: "13px",
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
            marginTop: "4px",
          }}
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ color: "#4C4C64", fontSize: "13px", textAlign: "center", marginTop: "24px" }}>
        Não tem conta?{" "}
        <Link href="/cadastro" style={{ color: "#E8A020", fontWeight: 500 }}>
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
