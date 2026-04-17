"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserManagedAgent } from "@/actions/users";

export interface AgentOption {
  type: string;
  label: string;
}

interface AssignAgentSelectorProps {
  userId: string;
  currentAgentType: string | null;
  availableAgents: AgentOption[];
}

export function AssignAgentSelector({
  userId,
  currentAgentType,
  availableAgents,
}: AssignAgentSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(currentAgentType ?? "");
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    startTransition(async () => {
      await updateUserManagedAgent(userId, newValue || null);
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      title="Atribuir setor"
      style={{
        height: "26px",
        padding: "0 6px",
        borderRadius: "5px",
        border: `1px solid ${value ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.1)"}`,
        background: value ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.04)",
        color: value ? "#74B4FB" : "#555",
        fontSize: "11px",
        fontWeight: 600,
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        outline: "none",
        fontFamily: "inherit",
        minWidth: "110px",
      }}
    >
      <option value="">Sem setor</option>
      {availableAgents.map((agent) => (
        <option key={agent.type} value={agent.type}>
          {agent.label}
        </option>
      ))}
    </select>
  );
}
