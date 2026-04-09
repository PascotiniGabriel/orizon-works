import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getCompanyStats, getCompanyUsers } from "@/lib/db/queries/admin";
import { InviteUserModal } from "@/components/app/InviteUserModal";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Bot,
} from "lucide-react";

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

const ROLE_COLORS: Record<string, string> = {
  company_admin: "bg-violet-50 text-violet-700 border-violet-200",
  sector_manager: "bg-blue-50 text-blue-700 border-blue-200",
  employee: "bg-gray-50 text-gray-600 border-gray-200",
  super_admin: "bg-red-50 text-red-700 border-red-200",
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users,
  marketing: Megaphone,
  comercial: TrendingUp,
  financeiro: DollarSign,
  administrativo: FolderOpen,
};

const AGENT_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

const AGENT_COLORS: Record<string, string> = {
  rh: "bg-violet-50 text-violet-600 border-violet-100",
  marketing: "bg-pink-50 text-pink-600 border-pink-100",
  comercial: "bg-blue-50 text-blue-600 border-blue-100",
  financeiro: "bg-emerald-50 text-emerald-600 border-emerald-100",
  administrativo: "bg-amber-50 text-amber-600 border-amber-100",
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">{info.companyName}</p>
      </div>

      {/* Tokens */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Consumo de Tokens</h2>
          <p className="text-xs text-gray-400 mt-0.5">Período atual</p>
        </div>
        <div className="p-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              {formatNumber(info.tokenLimit - info.tokenBalance)} usados
            </span>
            <span className="text-gray-400 text-xs">
              limite: {formatNumber(info.tokenLimit)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
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
            {formatNumber(info.tokenBalance)} tokens disponíveis ({100 - tokenPercent}% restante)
          </p>

          {info.tokenBalance < info.tokenLimit * 0.2 && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Saldo abaixo de 20%
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Adquira um Token Pack para continuar sem interrupção.
                </p>
              </div>
              <button
                className="shrink-0 ml-4 rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
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
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Resumo do mês</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Sessões", value: formatNumber(stats.totalSessions) },
                { label: "Mensagens", value: formatNumber(stats.totalMessages) },
                { label: "Tokens consumidos", value: formatNumber(stats.totalTokensUsed) },
                { label: "Usuários ativos", value: formatNumber(stats.activeUsers) },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs text-gray-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Por agente */}
          {stats.agentStats.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Uso por Agente</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.agentStats.map((a) => {
                  const Icon = AGENT_ICONS[a.agentType] ?? Bot;
                  const colorClass = AGENT_COLORS[a.agentType] ?? "bg-gray-50 text-gray-500 border-gray-100";
                  return (
                    <div key={a.agentType} className="flex items-center gap-4 px-6 py-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colorClass}`}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
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
                  );
                })}
              </div>
            </section>
          )}

          {/* Usuários */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Usuários</h2>
                <p className="text-xs text-gray-400 mt-0.5">{companyUsers.length} cadastrado(s)</p>
              </div>
              <InviteUserModal />
            </div>
            {companyUsers.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Nenhum usuário cadastrado ainda.</p>
                <p className="text-xs text-gray-400 mt-1">Convide funcionários usando o botão acima.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
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
                    <div className="shrink-0 text-right space-y-1">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[u.role] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <p className="text-xs text-gray-400">
                        Último acesso: {formatDate(u.lastSeenAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-300 tabular-nums">
                      {u.sessionCount} sessões
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
