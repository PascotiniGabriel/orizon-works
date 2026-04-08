import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getCompanyStats, getCompanyUsers } from "@/lib/db/queries/admin";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Admin",
  sector_manager: "Resp. de Setor",
  employee: "Funcionário",
  super_admin: "Super Admin",
};

const AGENT_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function formatDate(date: Date | null) {
  if (!date) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  // Apenas admins veem o painel completo
  const isAdmin = info.role === "company_admin" || info.role === "super_admin";

  const [stats, companyUsers] = isAdmin
    ? await Promise.all([
        getCompanyStats(info.companyId),
        getCompanyUsers(info.companyId),
      ])
    : [null, []];

  const tokenPercent = stats
    ? Math.round(((info.tokenLimit - info.tokenBalance) / info.tokenLimit) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">{info.companyName}</p>
      </div>

      {/* Tokens */}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Consumo de Tokens</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias</p>
        </div>
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {formatNumber(info.tokenLimit - info.tokenBalance)} usados
            </span>
            <span className="text-gray-400">
              limite: {formatNumber(info.tokenLimit)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(tokenPercent, 100)}%`,
                backgroundColor:
                  tokenPercent > 80
                    ? "#ef4444"
                    : tokenPercent > 60
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {formatNumber(info.tokenBalance)} tokens disponíveis
          </p>

          {info.tokenBalance < info.tokenLimit * 0.2 && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Saldo baixo — menos de 20% restante
                </p>
                <p className="text-xs text-amber-600">
                  Adquira um Token Pack para continuar usando os agentes sem interrupção.
                </p>
              </div>
              <button
                className="shrink-0 ml-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#E8A020" }}
                disabled
                title="Em breve"
              >
                + 2M tokens — R$79
              </button>
            </div>
          )}
        </div>
      </section>

      {isAdmin && stats && (
        <>
          {/* Estatísticas */}
          <section>
            <h2 className="mb-3 font-semibold text-gray-900">Resumo do Mês</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Sessões", value: formatNumber(stats.totalSessions) },
                { label: "Mensagens", value: formatNumber(stats.totalMessages) },
                { label: "Tokens consumidos", value: formatNumber(stats.totalTokensUsed) },
                { label: "Usuários ativos", value: formatNumber(stats.activeUsers) },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <p className="text-xs text-gray-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Por agente */}
          {stats.agentStats.length > 0 && (
            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900">Uso por Agente</h2>
              </div>
              <div className="divide-y">
                {stats.agentStats.map((a) => (
                  <div key={a.agentType} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg border border-amber-100">
                      🤖
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.agentName}</p>
                      <p className="text-xs text-gray-400">
                        {AGENT_LABELS[a.agentType] ?? a.agentType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {a.sessions} sessões
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatNumber(a.tokens)} tokens
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Usuários */}
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Usuários</h2>
              <span className="text-xs text-gray-400">
                {companyUsers.length} cadastrado(s)
              </span>
            </div>
            <div className="divide-y">
              {companyUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {(u.fullName ?? u.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {u.fullName ?? u.email}
                    </p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-600">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      Último acesso: {formatDate(u.lastSeenAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-300">
                    {u.sessionCount} sessões
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
