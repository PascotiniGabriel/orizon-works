import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionsHistory } from "@/lib/db/queries/sessions";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function HistoricoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const sessoes = await getSessionsHistory(info.companyId, info.userId, info.role);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Conversas</h1>
        <p className="mt-1 text-sm text-gray-500">
          {info.role === "employee"
            ? "Suas conversas dos últimos 30 dias."
            : "Todas as conversas da empresa dos últimos 30 dias."}
        </p>
      </div>

      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-16 text-center">
          <div className="mb-3 text-4xl">🕐</div>
          <p className="font-medium text-gray-700">Nenhuma conversa ainda</p>
          <p className="mt-1 text-sm text-gray-400">
            As conversas com os agentes aparecerão aqui.
          </p>
          <Link
            href="/escritorio"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#E8A020" }}
          >
            Ir ao Escritório
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="divide-y">
            {sessoes.map((s) => {
              const agentLabel =
                s.agentName ?? AGENT_TYPE_LABELS[s.agentType] ?? s.agentType;
              return (
                <Link
                  key={s.id}
                  href={`/escritorio/historico/${s.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  {/* Avatar do agente */}
                  {s.agentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.agentAvatarUrl}
                      alt={agentLabel}
                      className="h-10 w-10 shrink-0 rounded-xl border border-gray-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl border border-amber-100">
                      🤖
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{agentLabel}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {AGENT_TYPE_LABELS[s.agentType] ?? s.agentType}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(s.updatedAt)}</span>
                      <span>·</span>
                      <span>{s.messageCount} mensagens</span>
                      <span>·</span>
                      <span>{s.tokensUsed.toLocaleString("pt-BR")} tokens</span>
                      {info.role !== "employee" && s.userName && (
                        <>
                          <span>·</span>
                          <span>{s.userName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Seta */}
                  <span className="shrink-0 text-gray-300">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
