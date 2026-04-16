/**
 * Audit log de ações administrativas.
 * Registra eventos relevantes para auditoria na tabela audit_logs.
 * Falha silenciosa — nunca bloqueia a ação principal.
 */

import { adminSupabase } from "@/lib/supabase/admin";

export type AuditAction =
  | "user.invite"
  | "user.role_change"
  | "user.deactivate"
  | "agent.activate"
  | "agent.deactivate"
  | "rag.document_delete"
  | "rag.document_upload"
  | "subscription.token_pack_purchase"
  | "company.settings_update";

interface AuditParams {
  companyId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await adminSupabase.from("audit_logs").insert({
      company_id: params.companyId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Falha silenciosa — audit log nunca deve impedir a operação principal
  }
}
