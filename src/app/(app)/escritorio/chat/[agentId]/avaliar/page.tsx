import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { CurriculoRankingWorkspace } from "./CurriculoRankingWorkspace";

interface AvaliarPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function AvaliarCurriculosPage({ params }: AvaliarPageProps) {
  const { agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const data = await getAgentWithBriefings(agentId, info.companyId);
  if (!data) notFound();

  // Só agente de RH tem este workspace
  if (data.agent.type !== "rh") {
    redirect(`/escritorio/chat/${agentId}`);
  }

  const agentPrompt =
    data.agentBriefing?.compiledPrompt ??
    data.companyBriefing?.compiledPrompt ??
    "";

  return (
    <div style={{ height: "calc(100vh - 56px - 48px)" }}>
      <CurriculoRankingWorkspace
        agentId={agentId}
        agentPrompt={agentPrompt}
        agentDisplayName={data.agent.customName ?? "Ana — RH"}
      />
    </div>
  );
}
