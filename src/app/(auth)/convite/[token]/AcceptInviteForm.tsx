"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/actions/invites";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface AcceptInviteFormProps {
  token: string;
  email: string;
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || password.length < 6) {
      setError("Preencha todos os campos. Senha mínima de 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await acceptInvite(token, password, fullName.trim());

    if (!result.success) {
      setError(result.error ?? "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/login?message=conta-criada");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "46px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "0 14px",
    color: "#EBEBEB",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#888",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "7px",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}
    >
      {/* Email (read-only) */}
      <div>
        <label style={labelStyle}>E-mail</label>
        <input
          value={email}
          disabled
          style={{ ...inputStyle, color: "#555", cursor: "not-allowed" }}
        />
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="fullName" style={labelStyle}>Seu nome completo</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome Sobrenome"
          required
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.background = "rgba(16,185,129,0.04)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" style={labelStyle}>Crie uma senha</label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            style={{ ...inputStyle, paddingRight: "44px" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.background = "rgba(16,185,129,0.04)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", padding: 0 }}
          >
            {showPassword ? (
              <EyeOff style={{ width: "16px", height: "16px" }} strokeWidth={1.75} />
            ) : (
              <Eye style={{ width: "16px", height: "16px" }} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#F87171", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ height: "46px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "8px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
      >
        {loading && <Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />}
        {loading ? "Criando conta..." : "Criar minha conta"}
      </button>
    </form>
  );
}
