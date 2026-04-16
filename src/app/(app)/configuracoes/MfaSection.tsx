"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Factor } from "@supabase/supabase-js";

type MfaStatus = "loading" | "disabled" | "enrolling" | "enabled";

export function MfaSection() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [factor, setFactor] = useState<Factor | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [newFactorId, setNewFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadFactors() {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (totp && totp.status === "verified") {
        setFactor(totp);
        setStatus("enabled");
      } else {
        setStatus("disabled");
      }
    }
    loadFactors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEnroll() {
    setSaving(true);
    setVerifyError("");

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setVerifyError("Erro ao iniciar cadastro do 2FA. Tente novamente.");
      setSaving(false);
      return;
    }

    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setNewFactorId(data.id);
    setStatus("enrolling");
    setSaving(false);
  }

  async function handleVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (verifyCode.length !== 6) return;

    setSaving(true);
    setVerifyError("");

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: newFactorId,
      code: verifyCode,
    });

    if (error) {
      setVerifyError("Código inválido. Verifique o aplicativo autenticador.");
      setVerifyCode("");
      setSaving(false);
      return;
    }

    // Recarregar fatores
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp?.[0];
    setFactor(totp ?? null);
    setStatus("enabled");
    setVerifyCode("");
    setSaving(false);
  }

  async function handleUnenroll() {
    if (!factor) return;
    if (!confirm("Tem certeza que deseja desativar a verificação em duas etapas?")) return;

    setSaving(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      alert("Erro ao desativar 2FA. Tente novamente.");
      setSaving(false);
      return;
    }

    setFactor(null);
    setStatus("disabled");
    setSaving(false);
  }

  function handleCancelEnroll() {
    if (newFactorId) {
      supabase.auth.mfa.unenroll({ factorId: newFactorId }).catch(() => {});
    }
    setStatus("disabled");
    setQrCode("");
    setSecret("");
    setNewFactorId("");
    setVerifyCode("");
    setVerifyError("");
  }

  if (status === "loading") {
    return (
      <div style={{ padding: "20px 0", color: "#666", fontSize: "14px" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      {status === "disabled" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
              Verificação em duas etapas
            </p>
            <p style={{ color: "#666", fontSize: "13px" }}>
              Adicione uma camada extra de segurança com um aplicativo autenticador (Google Authenticator, Authy).
            </p>
          </div>
          <button
            type="button"
            onClick={handleEnroll}
            disabled={saving}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "8px",
              color: "#10B981",
              fontSize: "13px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {saving ? "Aguarde..." : "Ativar 2FA"}
          </button>
        </div>
      )}

      {status === "enrolling" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
              Configurar autenticador
            </p>
            <p style={{ color: "#666", fontSize: "13px" }}>
              Escaneie o QR Code com seu aplicativo autenticador, ou insira a chave manualmente.
            </p>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR Code 2FA"
                width={160}
                height={160}
                style={{ borderRadius: "10px", border: "3px solid white" }}
              />
            </div>
          )}

          {/* Chave manual */}
          {secret && (
            <div style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "12px 16px" }}>
              <p style={{ color: "#666", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Chave manual
              </p>
              <p style={{ color: "#EBEBEB", fontSize: "13px", fontFamily: "monospace", letterSpacing: "2px", wordBreak: "break-all" }}>
                {secret}
              </p>
            </div>
          )}

          {/* Verificação */}
          <form onSubmit={handleVerifyEnrollment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "13px", fontWeight: 500, marginBottom: "7px" }}>
                Código do autenticador
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                style={{
                  width: "100%", height: "46px",
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "0 14px",
                  color: "#EBEBEB", fontSize: "18px",
                  letterSpacing: "6px", textAlign: "center",
                  outline: "none", fontFamily: "monospace",
                }}
              />
            </div>

            {verifyError && (
              <p style={{ color: "#F87171", fontSize: "13px" }}>{verifyError}</p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                disabled={saving || verifyCode.length !== 6}
                style={{
                  flex: 1, height: "40px",
                  background: saving || verifyCode.length !== 6 ? "rgba(16,185,129,0.4)" : "#10B981",
                  color: "#000", fontWeight: 700, fontSize: "14px",
                  border: "none", borderRadius: "8px",
                  cursor: saving || verifyCode.length !== 6 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Verificando..." : "Confirmar ativação"}
              </button>
              <button
                type="button"
                onClick={handleCancelEnroll}
                style={{
                  padding: "0 16px", height: "40px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", color: "#666",
                  fontSize: "14px", cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {status === "enabled" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
            <div>
              <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>
                Verificação em duas etapas ativa
              </p>
              <p style={{ color: "#666", fontSize: "13px" }}>
                Sua conta está protegida com autenticador TOTP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnenroll}
            disabled={saving}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "8px",
              color: "#F87171",
              fontSize: "13px",
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {saving ? "Aguarde..." : "Desativar"}
          </button>
        </div>
      )}
    </div>
  );
}
