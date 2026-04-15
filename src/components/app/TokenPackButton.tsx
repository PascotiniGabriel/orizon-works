"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";

export function TokenPackButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/token-pack/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Erro ao iniciar checkout. Tente novamente.");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 ml-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
      style={{ backgroundColor: "#10B981" }}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Zap className="h-3.5 w-3.5" />
      )}
      {loading ? "Aguarde..." : "+ 2M tokens — R$79"}
    </button>
  );
}
