"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INPUT: React.CSSProperties = {
  width: "100%", height: "52px",
  background: "#1A1A1A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", padding: "0 14px",
  color: "#EBEBEB", fontSize: "20px",
  letterSpacing: "8px", textAlign: "center",
  outline: "none", fontFamily: "monospace",
};

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Listar fatores para pegar o factorId
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) {
        setError("Nenhum fator 2FA encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }

      // Criar challenge e verificar em um passo
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code,
      });

      if (verifyError) {
        setError("Código inválido ou expirado. Tente novamente.");
        setCode("");
        setLoading(false);
        return;
      }

      router.replace("/escritorio");
    } catch {
      setError("Erro ao verificar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", background: "#10B981", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#000", fontSize: "15px", fontWeight: 800 }}>O</span>
          </div>
          <span style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}>Orizon Works</span>
        </div>

        {/* Card */}
        <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "32px" }}>
          {/* Ícone */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ width: "52px", height: "52px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <h1 style={{ color: "#EBEBEB", fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Verificação em duas etapas
          </h1>
          <p style={{ color: "#666", fontSize: "14px", textAlign: "center", marginBottom: "28px", lineHeight: 1.5 }}>
            Abra seu aplicativo autenticador e insira o código de 6 dígitos.
          </p>

          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
              autoFocus
              style={INPUT}
            />

            {error && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "8px", padding: "10px 14px", color: "#F87171", fontSize: "13px", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{ width: "100%", height: "46px", background: loading || code.length !== 6 ? "rgba(16,185,129,0.5)" : "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", border: "none", borderRadius: "8px", cursor: loading || code.length !== 6 ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </form>
        </div>

        <p style={{ color: "#444", fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
          Perdeu acesso ao autenticador?{" "}
          <a href="mailto:suporte@orizonworks.com.br" style={{ color: "#10B981", textDecoration: "none" }}>
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
