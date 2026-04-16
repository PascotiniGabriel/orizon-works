"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelInvite } from "@/actions/invites";
import { X, Loader2 } from "lucide-react";

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelInvite(inviteId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Erro ao cancelar");
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {error && (
        <span style={{ color: "#F87171", fontSize: "11px" }}>{error}</span>
      )}
      <button
        onClick={handleCancel}
        disabled={isPending}
        title="Remover convite"
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          height: "26px", padding: "0 10px", borderRadius: "5px",
          border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)",
          color: "#F87171", fontSize: "12px", fontWeight: 500,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s",
        }}
      >
        {isPending
          ? <Loader2 style={{ width: "12px", height: "12px" }} />
          : <X style={{ width: "12px", height: "12px" }} strokeWidth={2.5} />}
        {isPending ? "..." : "Remover"}
      </button>
    </div>
  );
}
