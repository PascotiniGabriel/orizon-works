import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Bot,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

const AGENT_TYPE_ICONS: Record<string, React.ElementType> = {
  rh: Users,
  marketing: Megaphone,
  comercial: TrendingUp,
  financeiro: DollarSign,
  administrativo: FolderOpen,
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

const AGENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  rh: "Recrutamento, avaliação de currículos e entrevistas",
  marketing: "Conteúdo, campanhas e estratégia de marca",
  comercial: "Scripts de vendas, propostas e follow-up",
  financeiro: "Relatórios, análises e controle financeiro",
  administrativo: "Documentos, e-mails e organização",
};

const AGENT_TYPE_GRADIENTS: Record<string, string> = {
  rh: "from-violet-500 to-purple-600",
  marketing: "from-pink-500 to-rose-600",
  comercial: "from-blue-500 to-indigo-600",
  financeiro: "from-emerald-500 to-teal-600",
  administrativo: "from-amber-500 to-orange-600",
};

const AGENT_TYPE_LIGHT: Record<string, string> = {
  rh: "bg-violet-50 border-violet-100 text-violet-600",
  marketing: "bg-pink-50 border-pink-100 text-pink-600",
  comercial: "bg-blue-50 border-blue-100 text-blue-600",
  financeiro: "bg-emerald-50 border-emerald-100 text-emerald-600",
  administrativo: "bg-amber-50 border-amber-100 text-amber-600",
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {agents.length > 0
              ? "Selecione um agente para começar a trabalhar."
              : "Configure seus agentes para começar."}
          </p>
        </div>
      </div>

      {/* Grid de agentes */}
      {agents.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
            const description = AGENT_TYPE_DESCRIPTIONS[agent.type] ?? "Agente especializado";
            const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
            const gradient = AGENT_TYPE_GRADIENTS[agent.type] ?? "from-gray-400 to-gray-600";
            const lightClass = AGENT_TYPE_LIGHT[agent.type] ?? "bg-gray-50 border-gray-100 text-gray-500";

            return (
              <Link
                key={agent.id}
                href={`/escritorio/chat/${agent.id}`}
                className="group relative flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                {/* Ícone */}
                <div className="flex items-start justify-between">
                  {agent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.avatarUrl}
                      alt={label}
                      className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
                    >
                      <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                    </div>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      agent.briefingComplete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {agent.briefingComplete ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {agent.briefingComplete ? "Pronto" : "Configurando"}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <span className={`rounded-md border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide ${lightClass}`}>
                      {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Clique para conversar</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:gap-1.5">
                    Abrir <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
            <Bot className="h-8 w-8 text-amber-500" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-gray-800">Nenhum agente configurado</p>
          <p className="mt-1 text-sm text-gray-400 max-w-xs">
            Configure seu primeiro agente para começar a automatizar tarefas com IA.
          </p>
          <Link
            href="/onboarding/setor"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#E8A020" }}
          >
            Criar primeiro agente <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
