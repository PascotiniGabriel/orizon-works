import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getPlatformStats, getAllCompanies } from "@/lib/db/queries/admin";
import { AdminCompanyActions } from "@/components/app/AdminCompanyActions";

const PLAN_LABELS: Record<string, string> = {
  trial:      "Trial",
  starter:    "Starter",
  growth:     "Growth",
  business:   "Business",
  enterprise: "Enterprise",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  trialing: { bg: "rgba(96,165,250,0.1)",   color: "#60A5FA" },
  active:   { bg: "rgba(16,185,129,0.1)",   color: "#10B981" },
  past_due: { bg: "rgba(251,191,36,0.1)",   color: "#FBBF24" },
  canceled: { bg: "rgba(255,255,255,0.05)", color: "#555"    },
  unpaid:   { bg: "rgba(248,113,113,0.1)",  color: "#F87171" },
};

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  if (info.role !== "super_admin") redirect("/escritorio");

  const [stats, companiesList] = await Promise.all([
    getPlatformStats(),
    getAllCompanies(),
  ]);

  const KPI_CARDS = [
    { label: "Empresas",          value: formatNumber(stats.totalCompanies)       },
    { label: "Ativas",            value: formatNumber(stats.totalActiveCompanies) },
    { label: "Em Trial",          value: formatNumber(stats.totalTrialCompanies)  },
    { label: "Usuários",          value: formatNumber(stats.totalUsers)           },
    { label: "MRR",               value: formatCurrency(stats.mrr)               },
    { label: "Tokens consumidos", value: formatNumber(stats.totalTokensConsumed)  },
  ];

  const TABLE_HEADER: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    color: "#3A3A3A",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Page header */}
      <div
        style={{
          padding: "18px 28px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <h1 style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Super Admin
        </h1>
        <span
          style={{
            background: "rgba(16,185,129,0.1)",
            color: "#10B981",
            fontSize: "9px",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: "3px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Admin
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: "1100px" }}>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "32px",
        }}
      >
        {KPI_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "7px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#3A3A3A", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
              {card.label}
            </p>
            <p
              style={{
                color: "#EBEBEB",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Companies table */}
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Todas as Empresas
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <th style={TABLE_HEADER}>Empresa</th>
                <th style={TABLE_HEADER}>Plano</th>
                <th style={TABLE_HEADER}>Status</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Tokens</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Usuários</th>
                <th style={TABLE_HEADER}>Cadastro</th>
                <th style={TABLE_HEADER}></th>
              </tr>
            </thead>
            <tbody>
              {companiesList.map((c, i) => {
                const usedPercent =
                  c.tokenLimit > 0
                    ? Math.round(((c.tokenLimit - c.tokenBalance) / c.tokenLimit) * 100)
                    : 0;
                const statusStyle = STATUS_STYLES[c.subscriptionStatus] ?? STATUS_STYLES.canceled;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                      transition: "background 0.1s",
                      position: "relative",
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "#EBEBEB", fontWeight: 500 }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#888" }}>
                      {PLAN_LABELS[c.plan] ?? c.plan}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 500,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <div
                          style={{
                            width: "56px",
                            height: "4px",
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.07)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(usedPercent, 100)}%`,
                              background: usedPercent > 80 ? "#F87171" : "#4EDBA4",
                              borderRadius: "2px",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            color: "#555",
                            fontSize: "11px",
                            fontFamily: "var(--font-geist-mono)",
                            minWidth: "28px",
                            textAlign: "right",
                          }}
                        >
                          {usedPercent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#888", textAlign: "right", fontFamily: "var(--font-geist-mono)" }}>
                      {c.userCount}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#3A3A3A", fontFamily: "var(--font-geist-mono)" }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <AdminCompanyActions
                      companyId={c.id}
                      currentPlan={c.plan}
                      currentStatus={c.subscriptionStatus}
                      currentTokenLimit={c.tokenLimit}
                      currentMaxAgents={5}
                    />
                  </tr>
                );
              })}
              {companiesList.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#3A3A3A",
                      fontSize: "13px",
                    }}
                  >
                    Nenhuma empresa cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
