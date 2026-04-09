import { notFound, redirect } from "next/navigation";
import { getInviteByToken } from "@/actions/invites";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ROLE_LABELS: Record<string, string> = {
  employee: "Funcionário",
  sector_manager: "Responsável de Setor",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) notFound();

  if (invite.status === "accepted") {
    redirect("/login?message=convite-ja-aceito");
  }

  if (invite.status === "expired" || new Date() > invite.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">⏰</div>
          <h1 className="text-xl font-bold text-gray-900">Convite expirado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Este convite expirou. Peça ao administrador para enviar um novo convite.
          </p>
        </div>
      </div>
    );
  }

  // Busca nome da empresa
  const company = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, invite.companyId))
    .limit(1)
    .then((r) => r[0]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #E8A020, #f5c55a)" }}
          >
            O
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Você foi convidado</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crie sua conta para acessar o OrizonWorks
          </p>
        </div>

        {/* Card de info do convite */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Building2 className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {company?.name ?? "Empresa"}
              </p>
              <p className="text-xs text-amber-700">
                Função: <strong>{ROLE_LABELS[invite.role] ?? invite.role}</strong>
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Convite para: {invite.email}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <AcceptInviteForm token={token} email={invite.email} />
      </div>
    </div>
  );
}
