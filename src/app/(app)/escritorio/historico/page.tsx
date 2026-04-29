import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionsHistory } from "@/lib/db/queries/sessions";
import { Clock } from "lucide-react";
import { HistoricoClient } from "./HistoricoClient";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const sessoes = await getSessionsHistory(info.companyId, info.userId, info.role);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Page header */}
      <div style={{ padding: "18px 30px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.02em" }}>Histórico</h1>
          {sessoes.length > 0 && (
            <span style={{ background: "rgba(255,255,255,0.06)", color: "#888", fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
              {sessoes.length}
            </span>
          )}
        </div>
        <p style={{ color: "#3A3A3A", fontSize: "13px" }}>
          {info.role === "employee" ? "Suas conversas · 30 dias" : "Toda a empresa · 30 dias"}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 30px" }}>
        {sessoes.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "8px", maxWidth: "480px", margin: "0 auto" }}>
            <Clock style={{ width: "36px", height: "36px", color: "#2A2A2A", marginBottom: "18px" }} strokeWidth={1.25} />
            <p style={{ color: "#888", fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>Nenhuma conversa ainda</p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Entre em qualquer agente e comece — seu histórico aparecerá aqui.
            </p>
            <Link href="/escritorio" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", background: "rgba(255,255,255,0.05)", color: "#888", fontWeight: 500, fontSize: "14px", borderRadius: "6px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
              Ir ao Escritório →
            </Link>
          </div>
        ) : (
          <HistoricoClient
            sessions={sessoes}
            showUserName={info.role !== "employee"}
          />
        )}
      </div>
    </div>
  );
}
