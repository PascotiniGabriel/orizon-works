import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { WorkspaceShell } from "./WorkspaceShell";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh:             "RH",
  marketing:      "Marketing",
  comercial:      "Comercial",
  financeiro:     "Financeiro",
  administrativo: "Administrativo",
};

interface ChatPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { agentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const data = await getAgentWithBriefings(agentId, info.companyId);
  if (!data) notFound();

  const { agent } = data;
  const agentDisplayName = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
  const canSeeDocumentos = ["company_admin", "sector_manager"].includes(info.role);

  const briefingComplete = data.agentBriefing?.isComplete ?? false;

  return (
    <WorkspaceShell
      agentId={agent.id}
      agentType={agent.type}
      agentDisplayName={agentDisplayName}
      agentAvatarUrl={agent.avatarUrl}
      canSeeDocumentos={canSeeDocumentos}
      companyId={info.companyId}
      userRole={info.role}
      briefingComplete={briefingComplete}
    />
  );
}
