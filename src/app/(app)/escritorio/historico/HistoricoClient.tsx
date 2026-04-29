"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bot, ChevronRight, Search } from "lucide-react";
import type { SessionHistoryItem } from "@/lib/db/queries/sessions";
import { tokensToCredits, formatCredits } from "@/lib/utils/credits";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};
const AGENT_DOT: Record<string, string> = {
  rh: "#A78BFA", marketing: "#FB7185", comercial: "#60A5FA",
  financeiro: "#10B981", administrativo: "#FBBF24",
};

function formatRelativeDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";

  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff <= 6) return `${diff} dias atrás`;

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(sessions: SessionHistoryItem[]): { label: string; items: SessionHistoryItem[] }[] {
  const groups = new Map<string, SessionHistoryItem[]>();
  for (const s of sessions) {
    const key = formatRelativeDate(s.updatedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

interface Props {
  sessions: SessionHistoryItem[];
  showUserName: boolean;
}

const ALL_TYPES = "todos";

export function HistoricoClient({ sessions, showUserName }: Props) {
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState(ALL_TYPES);

  const agentTypes = useMemo(() => {
    const types = new Set(sessions.map((s) => s.agentType));
    return Array.from(types);
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (agentFilter !== ALL_TYPES && s.agentType !== agentFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      const label = (s.agentName ?? AGENT_TYPE_LABELS[s.agentType] ?? s.agentType).toLowerCase();
      const user = (s.userName ?? "").toLowerCase();
      const preview = (s.preview ?? "").toLowerCase();
      return label.includes(q) || user.includes(q) || preview.includes(q);
    });
  }, [sessions, query, agentFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#444", pointerEvents: "none" }} strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar sessões..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", height: "36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#EBEBEB", fontSize: "14px", paddingLeft: "34px", paddingRight: "12px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          style={{ height: "36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: agentFilter === ALL_TYPES ? "#555" : "#EBEBEB", fontSize: "14px", padding: "0 12px", outline: "none", cursor: "pointer" }}
        >
          <option value={ALL_TYPES}>Todos os agentes</option>
          {agentTypes.map((t) => (
            <option key={t} value={t}>{AGENT_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p style={{ color: "#444", fontSize: "14px", textAlign: "center", padding: "48px 0" }}>
          Nenhuma sessão encontrada.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <p style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "8px" }}>
                {label}
              </p>
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden" }}>
                {items.map((s, i) => {
                  const agentLabel = s.agentName ?? AGENT_TYPE_LABELS[s.agentType] ?? s.agentType;
                  const dot = AGENT_DOT[s.agentType] ?? "#555";
                  const preview = s.preview ? s.preview.slice(0, 100) + (s.preview.length > 100 ? "…" : "") : null;
                  return (
                    <Link
                      key={s.id}
                      href={`/escritorio/historico/${s.id}`}
                      className="ow-row"
                      style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", textDecoration: "none", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
                    >
                      {/* Avatar */}
                      {s.agentAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.agentAvatarUrl} alt={agentLabel} style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, marginTop: "2px" }} />
                      ) : (
                        <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                          <Bot style={{ width: "16px", height: "16px", color: dot }} strokeWidth={1.5} />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: preview ? "4px" : "3px" }}>
                          <span style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, letterSpacing: "-0.01em" }}>{agentLabel}</span>
                          <span style={{ background: "rgba(255,255,255,0.05)", color: "#444", fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {AGENT_TYPE_LABELS[s.agentType] ?? s.agentType}
                          </span>
                          {showUserName && s.userName && (
                            <span style={{ color: "#555", fontSize: "13px" }}>{s.userName}</span>
                          )}
                        </div>
                        {preview && (
                          <p style={{ color: "#555", fontSize: "13px", lineHeight: "1.45", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            &ldquo;{preview}&rdquo;
                          </p>
                        )}
                        <div style={{ color: "#3A3A3A", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}>
                          {formatTime(s.updatedAt)}
                          <span style={{ margin: "0 5px", color: "#2A2A2A" }}>·</span>
                          {s.messageCount} msgs
                          <span style={{ margin: "0 5px", color: "#2A2A2A" }}>·</span>
                          {formatCredits(tokensToCredits(s.tokensUsed))} créditos
                        </div>
                      </div>

                      <ChevronRight style={{ width: "15px", height: "15px", color: "#2A2A2A", flexShrink: 0, marginTop: "12px" }} strokeWidth={2} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
