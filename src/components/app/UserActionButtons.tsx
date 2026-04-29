"use client";

import { useState, useTransition } from "react";
import { setUserActiveStatus } from "@/actions/users";
import { UserX, UserCheck } from "lucide-react";

interface UserActionButtonsProps {
  userId: string;
  isActive: boolean;
}

export function UserActionButtons({ userId, isActive }: UserActionButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [localActive, setLocalActive] = useState(isActive);

  function handleToggle() {
    const next = !localActive;
    startTransition(async () => {
      const res = await setUserActiveStatus(userId, next);
      if (res.success) setLocalActive(next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={localActive ? "Desativar usuário" : "Reativar usuário"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "30px", height: "30px", borderRadius: "6px", border: "none",
        cursor: pending ? "wait" : "pointer", flexShrink: 0,
        background: localActive ? "rgba(248,113,113,0.08)" : "rgba(16,185,129,0.08)",
        color: localActive ? "#F87171" : "#10B981",
        opacity: pending ? 0.5 : 1, transition: "opacity 0.15s",
      }}
    >
      {localActive
        ? <UserX style={{ width: "14px", height: "14px" }} strokeWidth={2} />
        : <UserCheck style={{ width: "14px", height: "14px" }} strokeWidth={2} />
      }
    </button>
  );
}
