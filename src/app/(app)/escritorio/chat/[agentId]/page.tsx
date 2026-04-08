import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { ChatInterface } from "@/components/app/ChatInterface";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

interface ChatPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
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

  const { agent } = data;
  const agentDisplayName =
    agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;

  return (
    <div style={{ height: "calc(100vh - 56px - 48px)" }}>
      <ChatInterface
        agentId={agent.id}
        agentDisplayName={agentDisplayName}
        agentAvatarUrl={agent.avatarUrl}
        agentType={agent.type}
      />
    </div>
  );
}
