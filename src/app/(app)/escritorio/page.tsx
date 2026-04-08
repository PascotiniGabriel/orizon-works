import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";

const AGENT_TYPE_ICONS: Record<string, string> = {
  rh: "👥",
  marketing: "📣",
  comercial: "💼",
  financeiro: "📊",
  administrativo: "🗂️",
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

export default async function EscritorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const agents = await getCompanyAgents(info.companyId);
  const firstName = info.fullName?.split(" ")[0] ?? "por aqui";

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>
          Olá, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Selecione um agente para iniciar uma conversa.
        </p>
      </div>

      {/* Grid de agentes */}
      {agents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const label =
              agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
            const icon = AGENT_TYPE_ICONS[agent.type] ?? "🤖";

            return (
              <Link
                key={agent.id}
                href={`/escritorio/chat/${agent.id}`}
                className="group flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300"
              >
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  {agent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.avatarUrl}
                      alt={label}
                      className="h-14 w-14 rounded-xl border border-gray-100"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-2xl border border-amber-100">
                      {icon}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">
                      {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      agent.briefingComplete
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {agent.briefingComplete ? "✓ Configurado" : "Configuração pendente"}
                  </span>
                  <span className="text-xs font-medium text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Conversar →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 text-4xl">🤖</div>
          <p className="font-semibold text-gray-700">Nenhum agente configurado</p>
          <p className="mt-1 text-sm text-gray-400">
            Complete o onboarding para criar seu primeiro agente.
          </p>
          <Link
            href="/onboarding/setor"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#E8A020" }}
          >
            Criar agente
          </Link>
        </div>
      )}
    </div>
  );
}
