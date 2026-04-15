"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.success === true) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "24px" }}>
          <CheckCircle2 style={{ width: "22px", height: "22px", color: "#10B981" }} strokeWidth={2} />
        </div>

        <h1 style={{ color: "#EBEBEB", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "8px" }}>
          E-mail enviado!
        </h1>
        <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
          {state.message}
        </p>

        <Link
          href="/login"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#10B981", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: "#EBEBEB", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "8px" }}>
        Recuperar senha
      </h1>
      <p style={{ color: "#555", fontSize: "15px", marginBottom: "32px", lineHeight: "1.6" }}>
        Digite seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={{ display: "block", color: "#888", fontSize: "14px", fontWeight: 500, marginBottom: "7px" }}>
            E-mail
          </label>
          <input
            name="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            style={{ width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0 14px", color: "#EBEBEB", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.background = "rgba(16,185,129,0.04)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          />
          {state?.success === false && state.errors?.email && (
            <p style={{ color: "#F87171", fontSize: "13px", marginTop: "5px" }}>
              {state.errors.email[0]}
            </p>
          )}
        </div>

        {state?.success === false && state.message && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#F87171", fontSize: "13px" }}>
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{ height: "46px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "8px", border: "none", cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1, fontFamily: "inherit" }}
        >
          {pending ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>

      <p style={{ marginTop: "24px", textAlign: "center", color: "#555", fontSize: "14px" }}>
        Lembrou a senha?{" "}
        <Link href="/login" style={{ color: "#10B981", fontWeight: 500, textDecoration: "none" }}>
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
