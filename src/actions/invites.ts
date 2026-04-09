"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { invites, users } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { eq, and } from "drizzle-orm";

export type InviteActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(["employee", "sector_manager"]),
});

// ============================================================
// CRIAR CONVITE
// ============================================================

export async function createInvite(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Não autorizado" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada" };

  if (info.role !== "company_admin" && info.role !== "super_admin") {
    return { success: false, error: "Sem permissão para convidar usuários" };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const errors = z.flattenError(parsed.error);
    const first = Object.values(errors.fieldErrors)[0]?.[0];
    return { success: false, error: first ?? "Dados inválidos" };
  }

  const { email, role } = parsed.data;

  // Verifica se usuário já existe na empresa
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.companyId, info.companyId)))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "Este e-mail já está cadastrado na empresa" };
  }

  // Verifica convite pendente
  const existingInvite = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.email, email),
        eq(invites.companyId, info.companyId),
        eq(invites.status, "pending")
      )
    )
    .limit(1);

  if (existingInvite.length > 0) {
    return { success: false, error: "Já existe um convite pendente para este e-mail" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await db.insert(invites).values({
    companyId: info.companyId,
    invitedByUserId: info.userId,
    email,
    role: role as "employee" | "sector_manager",
    token,
    expiresAt,
  });

  // Envia e-mail via Supabase
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${token}`;

  const { error: emailError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: inviteUrl,
      data: {
        invite_token: token,
        company_name: info.companyName,
        role,
      },
    }
  );

  if (emailError) {
    // Remove o convite criado se o e-mail falhou
    await db.delete(invites).where(eq(invites.token, token));
    return {
      success: false,
      error: "Erro ao enviar o e-mail. Tente novamente.",
    };
  }

  return {
    success: true,
    message: `Convite enviado para ${email}`,
  };
}

// ============================================================
// ACEITAR CONVITE (na página /convite/[token])
// ============================================================

export async function getInviteByToken(token: string) {
  const result = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      status: invites.status,
      expiresAt: invites.expiresAt,
      companyId: invites.companyId,
    })
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  return result[0] ?? null;
}

export async function acceptInvite(
  token: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  const invite = await getInviteByToken(token);

  if (!invite) return { success: false, error: "Convite não encontrado" };
  if (invite.status !== "pending") return { success: false, error: "Este convite já foi usado" };
  if (new Date() > invite.expiresAt) {
    await db.update(invites).set({ status: "expired" }).where(eq(invites.token, token));
    return { success: false, error: "Convite expirado" };
  }

  // Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    return { success: false, error: "Erro ao criar conta. O e-mail já pode estar em uso." };
  }

  // Cria o user na tabela users
  await db.insert(users).values({
    id: authData.user.id,
    companyId: invite.companyId,
    email: invite.email,
    fullName,
    role: invite.role,
  });

  // Marca convite como aceito
  await db
    .update(invites)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invites.token, token));

  return { success: true };
}
