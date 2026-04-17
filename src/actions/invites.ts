"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { invites, users } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { eq, and, lt } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

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

  // Auto-expirar convites vencidos (após 7 dias) para liberar o e-mail
  await db
    .update(invites)
    .set({ status: "expired" })
    .where(
      and(
        eq(invites.email, email),
        eq(invites.companyId, info.companyId),
        eq(invites.status, "pending"),
        lt(invites.expiresAt, new Date())
      )
    );

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
    console.error("[createInvite] Supabase emailError:", emailError.message, emailError.status);
    // Mensagens amigáveis para os erros mais comuns
    const msg = emailError.message?.toLowerCase() ?? "";
    if (msg.includes("already registered") || msg.includes("user already exists")) {
      return { success: false, error: "Este e-mail já possui uma conta no sistema." };
    }
    if (msg.includes("invalid redirect")) {
      return { success: false, error: "URL de redirecionamento inválida. Contate o suporte." };
    }
    return {
      success: false,
      error: `Erro ao enviar o e-mail: ${emailError.message}`,
    };
  }

  logAudit({
    companyId: info.companyId,
    userId: info.userId,
    action: "user.invite",
    entityType: "invite",
    metadata: { email, role },
  });

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

  // Tenta criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId: string;

  if (authError || !authData?.user) {
    // inviteUserByEmail já criou o usuário no Supabase Auth antes de enviar o e-mail.
    // Buscamos via Admin API (mais confiável que raw SQL em produção).
    const { data: listData } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = listData?.users?.find((u) => u.email === invite.email);

    if (!existingUser) {
      return { success: false, error: "Erro ao criar conta. Contate o suporte." };
    }

    // Atualiza senha e nome do usuário que já existe
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (updateError) {
      return { success: false, error: "Erro ao definir senha. Tente novamente." };
    }

    userId = existingUser.id;
  } else {
    userId = authData.user.id;
  }

  // Garante que o usuário existe na tabela public.users (evita duplicata)
  const [alreadyInDb] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!alreadyInDb) {
    await db.insert(users).values({
      id: userId,
      companyId: invite.companyId,
      email: invite.email,
      fullName,
      role: invite.role,
    });
  }

  // Marca convite como aceito
  await db
    .update(invites)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invites.token, token));

  return { success: true };
}

// ============================================================
// CANCELAR / REMOVER CONVITE
// ============================================================

export async function cancelInvite(inviteId: string): Promise<InviteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Não autorizado" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada" };

  if (info.role !== "company_admin" && info.role !== "super_admin") {
    return { success: false, error: "Sem permissão" };
  }

  // Verifica que o convite pertence a esta empresa
  const [invite] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.id, inviteId), eq(invites.companyId, info.companyId)))
    .limit(1);

  if (!invite) return { success: false, error: "Convite não encontrado" };

  await db.delete(invites).where(eq(invites.id, inviteId));

  return { success: true, message: "Convite removido com sucesso" };
}
