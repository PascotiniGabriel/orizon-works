import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getPlatformStats, getAllCompanies } from "@/lib/db/queries/admin";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

const STATUS_COLORS: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-gray-100 text-gray-500",
  unpaid: "bg-red-100 text-red-700",
};

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  // Apenas Super Admin
  if (info.role !== "super_admin") redirect("/escritorio");

  const [stats, companiesList] = await Promise.all([
    getPlatformStats(),
    getAllCompanies(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral da plataforma Orizon Works</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Empresas", value: formatNumber(stats.totalCompanies) },
          { label: "Ativas", value: formatNumber(stats.totalActiveCompanies) },
          { label: "Em Trial", value: formatNumber(stats.totalTrialCompanies) },
          { label: "Usuários", value: formatNumber(stats.totalUsers) },
          { label: "MRR", value: formatCurrency(stats.mrr) },
          { label: "Tokens consumidos", value: formatNumber(stats.totalTokensConsumed) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de empresas */}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Todas as Empresas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Usuários
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {companiesList.map((c) => {
                const usedPercent =
                  c.tokenLimit > 0
                    ? Math.round(((c.tokenLimit - c.tokenBalance) / c.tokenLimit) * 100)
                    : 0;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {PLAN_LABELS[c.plan] ?? c.plan}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[c.subscriptionStatus] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              usedPercent > 80 ? "bg-red-400" : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(usedPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-500">
                          {usedPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600">
                      {c.userCount}
                    </td>
                    <td className="px-4 py-4 text-gray-400">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {companiesList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    Nenhuma empresa cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
