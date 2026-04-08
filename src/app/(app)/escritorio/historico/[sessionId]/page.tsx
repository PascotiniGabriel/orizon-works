import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionDetail } from "@/lib/db/queries/sessions";

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

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const detail = await getSessionDetail(sessionId, info.companyId, info.userId, info.role);
  if (!detail) notFound();

  const { session, messages } = detail;
  const agentLabel =
    session.agentName ?? AGENT_TYPE_LABELS[session.agentType] ?? session.agentType;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/escritorio/historico"
          className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          ← Histórico
        </Link>
        <div className="flex items-center gap-3">
          {session.agentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.agentAvatarUrl}
              alt={agentLabel}
              className="h-9 w-9 rounded-xl border border-gray-100"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg border border-amber-100">
              🤖
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">{agentLabel}</h1>
            <p className="text-xs text-gray-400">
              {formatDate(session.createdAt)}
              {info.role !== "employee" && session.userName && ` · ${session.userName}`}
              {` · ${session.tokensUsed.toLocaleString("pt-BR")} tokens`}
            </p>
          </div>
        </div>
      </div>

      {/* Conversa */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              Nenhuma mensagem nesta sessão.
            </p>
          ) : (
            messages
              .filter((m) => m.role !== "system")
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-1 shrink-0">
                      {session.agentAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.agentAvatarUrl}
                          alt={agentLabel}
                          className="h-6 w-6 rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-xs border border-amber-100">
                          🤖
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-gray-50 text-gray-800 border rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user" ? { backgroundColor: "#E8A020" } : undefined
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer somente leitura */}
        <div className="border-t px-5 py-3">
          <p className="text-center text-xs text-gray-400">
            Sessão encerrada — visualização somente leitura
          </p>
        </div>
      </div>
    </div>
  );
}
