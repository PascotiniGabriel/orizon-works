import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { ChatInterface } from "@/components/app/ChatInterface";
import { Trophy } from "lucide-react";

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
    <div className="flex flex-col" style={{ height: "100vh" }}>
      {/* Extra action bar for RH agents */}
      {agent.type === "rh" && (
        <div
          className="flex shrink-0 items-center justify-end gap-2 px-4 py-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111111" }}
        >
          <Link
            href={`/escritorio/chat/${agent.id}/avaliar`}
            className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 hover:opacity-90"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#10B981",
            }}
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
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
