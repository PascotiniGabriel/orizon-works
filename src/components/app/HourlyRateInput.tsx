"use client";

import { useState } from "react";
import { updateHourlyRate } from "@/actions/company";

interface HourlyRateInputProps {
  initialRate: number;
}

export function HourlyRateInput({ initialRate }: HourlyRateInputProps) {
  const [value, setValue] = useState(String(initialRate));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    const n = parseFloat(value);
    if (isNaN(n) || n < 1) {
      setError("Valor mínimo: R$1");
      return;
    }
    setStatus("saving");
    setError("");
    const res = await updateHourlyRate(n);
    if (res.success) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setError(res.error ?? "Erro ao salvar");
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", overflow: "hidden" }}>
        <span style={{ color: "#555", fontSize: "13px", padding: "0 10px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>R$</span>
        <input
          type="number"
          min={1}
          max={9999}
          step={1}
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus("idle"); setError(""); }}
          style={{ background: "transparent", border: "none", outline: "none", color: "#EBEBEB", fontSize: "14px", padding: "7px 10px", width: "80px", fontFamily: "var(--font-geist-mono)" }}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        style={{ background: status === "saved" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${status === "saved" ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)"}`, color: status === "saved" ? "#10B981" : "#888", fontSize: "13px", fontWeight: 500, padding: "7px 14px", borderRadius: "6px", cursor: status === "saving" ? "not-allowed" : "pointer", transition: "all 0.15s" }}
      >
        {status === "saving" ? "Salvando…" : status === "saved" ? "Salvo ✓" : "Salvar"}
      </button>
      {error && <span style={{ color: "#F87171", fontSize: "12px" }}>{error}</span>}
    </div>
  );
}
