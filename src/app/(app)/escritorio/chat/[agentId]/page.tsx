import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { ChatInterface } from "@/components/app/ChatInterface";
import { Trophy } from "lucide-react";

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
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px - 48px)" }}>
      {/* Barra de ações extra por tipo de agente */}
      {agent.type === "rh" && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-gray-100 bg-white px-4 py-2">
          <Link
            href={`/escritorio/chat/${agent.id}/avaliar`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Trophy className="h-3.5 w-3.5" />
            Ranking de Currículos
          </Link>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          agentId={agent.id}
          agentDisplayName={agentDisplayName}
          agentAvatarUrl={agent.avatarUrl}
          agentType={agent.type}
        />
      </div>
    </div>
  );
}
