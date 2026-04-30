"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Wrench, BookOpen, AlertTriangle } from "lucide-react";
import { ChatInterface, type DailyBriefingCard } from "@/components/app/ChatInterface";
import { WorkspaceDashboard } from "./WorkspaceDashboard";
import { WorkspaceFerramentas } from "./WorkspaceFerramentas";
import { DocumentosClient } from "./documentos/DocumentosClient";

type Tab = "dashboard" | "chat" | "ferramentas" | "documentos";

interface WorkspaceShellProps {
  agentId: string;
  agentType: string;
  agentDisplayName: string;
  agentAvatarUrl: string | null;
  canSeeDocumentos: boolean;
  companyId: string;
  userRole: string;
  briefingComplete: boolean;
  dailyBriefing: DailyBriefingCard | null;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "chat",         label: "Chat",         icon: MessageSquare   },
  { id: "ferramentas",  label: "Ferramentas",  icon: Wrench          },
  { id: "documentos",   label: "Documentos",   icon: BookOpen        },
];

export function WorkspaceShell({
  agentId, agentType, agentDisplayName, agentAvatarUrl, canSeeDocumentos, companyId, userRole, briefingComplete, dailyBriefing,
}: WorkspaceShellProps) {
  const [active, setActive] = useState<Tab>("chat");

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "documentos") return canSeeDocumentos;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111111" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "2px",
        padding: "0 16px", height: "44px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#0D0D0D",
      }}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                height: "32px", padding: "0 14px", borderRadius: "6px",
                border: "none", cursor: "pointer", fontSize: "13px", fontWeight: isActive ? 600 : 400,
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                color: isActive ? "#EBEBEB" : "#555",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#888"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#555"; }}
            >
              <Icon style={{ width: "14px", height: "14px", color: isActive ? "#10B981" : "inherit" }} strokeWidth={isActive ? 2.25 : 1.75} />
              {tab.label}
              {tab.id === "ferramentas" && (
                <span style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", letterSpacing: "0.04em" }}>
                  NOVO
                </span>
              )}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />
        <span style={{ color: "#3A3A3A", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}>
          {agentDisplayName}
        </span>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {active === "dashboard" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <WorkspaceDashboard agentType={agentType} agentDisplayName={agentDisplayName} userRole={userRole} />
          </div>
        )}
        {active === "chat" && (
          briefingComplete ? (
            <ChatInterface
              agentId={agentId}
              agentDisplayName={agentDisplayName}
              agentAvatarUrl={agentAvatarUrl}
              agentType={agentType}
              dailyBriefing={dailyBriefing}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <AlertTriangle style={{ width: "22px", height: "22px", color: "#FBBF24" }} strokeWidth={1.75} />
              </div>
              <p style={{ color: "#EBEBEB", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "10px" }}>
                {agentDisplayName} ainda não está pronto
              </p>
              <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", maxWidth: "360px", marginBottom: "6px" }}>
                Complete o briefing para que o agente conheça a sua empresa e entregue resultados precisos.
              </p>
              <p style={{ color: "#3A3A3A", fontSize: "13px", marginBottom: "28px" }}>
                Sem briefing, as respostas serão genéricas.
              </p>
              <Link
                href="/configuracoes/briefing"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "14px", borderRadius: "7px", textDecoration: "none" }}
              >
                Configurar briefing agora →
              </Link>
            </div>
          )
        )}
        {active === "ferramentas" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <WorkspaceFerramentas agentType={agentType} />
          </div>
        )}
        {active === "documentos" && canSeeDocumentos && (
          <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
            <DocumentosClient agentId={agentId} companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}
