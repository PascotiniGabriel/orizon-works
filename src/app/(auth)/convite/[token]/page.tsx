import { notFound, redirect } from "next/navigation";
import { getInviteByToken } from "@/actions/invites";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { Building2, Clock } from "lucide-react";
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
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Clock style={{ width: "22px", height: "22px", color: "#F87171" }} strokeWidth={1.75} />
          </div>
          <h1 style={{ color: "#EBEBEB", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "10px" }}>
            Convite expirado
          </h1>
          <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6" }}>
            Este convite expirou. Peça ao administrador para enviar um novo convite.
          </p>
        </div>
      </div>
    );
  }

  const company = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, invite.companyId))
    .limit(1)
    .then((r) => r[0]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "18px", fontWeight: 800, color: "#000" }}>
            O
          </div>
          <h1 style={{ color: "#EBEBEB", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "6px" }}>
            Você foi convidado
          </h1>
          <p style={{ color: "#555", fontSize: "15px" }}>
            Crie sua conta para acessar o Orizon Works
          </p>
        </div>

        {/* Invite info card */}
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "8px", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 style={{ width: "16px", height: "16px", color: "#10B981" }} strokeWidth={1.75} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {company?.name ?? "Empresa"}
            </p>
            <p style={{ color: "#4EDBA4", fontSize: "13px", marginTop: "2px" }}>
              Função: {ROLE_LABELS[invite.role] ?? invite.role}
            </p>
            <p style={{ color: "#555", fontSize: "12px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {invite.email}
            </p>
          </div>
        </div>

        {/* Form */}
        <AcceptInviteForm token={token} email={invite.email} />
      </div>
    </div>
  );
}
