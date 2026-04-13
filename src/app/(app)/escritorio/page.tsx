import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { Bot, ArrowRight, Settings, Clock, Zap } from "lucide-react";
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
    <div className="mx-auto max-w-4xl">
      {/* Header / Greeting */}
      <div className="pt-2 pb-10">
        <p
          className="text-[11px] font-semibold uppercase mb-3"
          style={{ color: "#3E3E52", letterSpacing: "0.16em" }}
        >
          {greeting}
        </p>
        <h1
          className="font-bold leading-none"
          style={{
            color: "#EEECE6",
            fontSize: "52px",
            letterSpacing: "-0.04em",
          }}
        >
          {firstName}
        </h1>
        {agents.length > 0 && (
          <p
            className="mt-3 text-[15px]"
            style={{ color: "#64636E", letterSpacing: "-0.01em" }}
          >
            {readyCount === agents.length
              ? `${agents.length} agente${agents.length > 1 ? "s" : ""} pronto${agents.length > 1 ? "s" : ""} para trabalhar.`
              : `${readyCount} de ${agents.length} agentes configurados.`}
          </p>
        )}
      </div>

      {/* Agent command list */}
      {agents.length > 0 ? (
        <>
          <div className="mb-4">
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ color: "#3E3E52", letterSpacing: "0.14em" }}
            >
              Seus Agentes
            </p>
          </div>
          <AgentCommandList agents={agents} />

          {/* Quick links */}
          <div className="mt-6 flex items-center gap-2.5">
            <Link
              href="/configuracoes"
              className="flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-medium transition-all duration-150 hover:bg-white/[0.05]"
              style={{
                color: "#666680",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
              Configurações
            </Link>
            <Link
              href="/escritorio/historico"
              className="flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-medium transition-all duration-150 hover:bg-white/[0.05]"
              style={{
                color: "#666680",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Histórico
            </Link>
          </div>
        </>
      ) : (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          style={{ border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}
        >
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center"
            style={{
              background: "rgba(232,160,32,0.08)",
              border: "1px solid rgba(232,160,32,0.2)",
              borderRadius: "8px",
            }}
          >
            <Bot className="h-8 w-8" style={{ color: "#E8A020" }} strokeWidth={1.5} />
          </div>
          <p
            className="text-[18px] font-semibold"
            style={{ color: "#EEECE6", letterSpacing: "-0.02em" }}
          >
            Nenhum agente configurado
          </p>
          <p
            className="mt-2 max-w-xs text-[14px] leading-relaxed"
            style={{ color: "#4A4A60" }}
          >
            Configure seu primeiro agente de IA para começar a automatizar seu negócio.
          </p>
          <Link
            href="/onboarding/setor"
            className="mt-8 inline-flex items-center gap-2 rounded-[6px] px-6 py-3 text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#E8A020", color: "#07070C" }}
          >
            <Zap className="h-4 w-4" strokeWidth={2.5} />
            Criar primeiro agente
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
