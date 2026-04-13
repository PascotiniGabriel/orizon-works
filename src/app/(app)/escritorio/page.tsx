import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { Bot, ArrowRight, Clock, Settings } from "lucide-react";
import { AgentCommandList } from "@/components/app/AgentCommandList";

export default async function EscritorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const agents = await getCompanyAgents(info.companyId);
  const firstName = info.fullName?.split(" ")[0] ?? "você";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const readyCount = agents.filter((a) => a.briefingComplete).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <p
          className="text-[11px] font-semibold uppercase"
          style={{ color: "#2D2D3A", letterSpacing: "0.14em" }}
        >
          {greeting}
        </p>
        <h1
          className="text-[28px] font-semibold leading-tight"
          style={{ color: "#F2F0EA", letterSpacing: "-0.04em" }}
        >
          {firstName}
        </h1>
        {agents.length > 0 && (
          <p className="text-[13px]" style={{ color: "#64636E" }}>
            {readyCount === agents.length
              ? `${agents.length} agente${agents.length > 1 ? "s" : ""} pronto${agents.length > 1 ? "s" : ""} para trabalhar.`
              : `${readyCount} de ${agents.length} agentes configurados.`}
          </p>
        )}
      </div>

      {/* Agent command list */}
      {agents.length > 0 ? (
        <AgentCommandList agents={agents} />
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-20 text-center"
          style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
        >
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-[8px]"
            style={{
              background: "rgba(232,160,32,0.08)",
              border: "1px solid rgba(232,160,32,0.18)",
            }}
          >
            <Bot className="h-7 w-7" style={{ color: "#E8A020" }} strokeWidth={1.5} />
          </div>
          <p
            className="text-[15px] font-medium"
            style={{ color: "#F2F0EA", letterSpacing: "-0.01em" }}
          >
            Nenhum agente configurado
          </p>
          <p className="mt-1.5 max-w-xs text-[13px]" style={{ color: "#3D3D50" }}>
            Configure seu primeiro agente de IA para começar a automatizar seu negócio.
          </p>
          <Link
            href="/onboarding/setor"
            className="mt-6 inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#E8A020", color: "#09090E" }}
          >
            Criar primeiro agente
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      )}

      {/* Quick links */}
      {agents.length > 0 && (
        <div className="flex items-center gap-2.5">
          <Link
            href="/configuracoes"
            className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] transition-all duration-150 hover:bg-white/[0.05]"
            style={{ color: "#3D3D50", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Settings className="h-3 w-3" strokeWidth={1.75} />
            Configurações
          </Link>
          <Link
            href="/escritorio/historico"
            className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] transition-all duration-150 hover:bg-white/[0.05]"
            style={{ color: "#3D3D50", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            Histórico
          </Link>
        </div>
      )}
    </div>
  );
}
