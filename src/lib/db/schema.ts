import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  pgEnum,
  index,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

export const planEnum = pgEnum("plan", [
  "trial",
  "starter",
  "growth",
  "business",
  "enterprise",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "company_admin",
  "sector_manager",
  "employee",
]);

export const agentTypeEnum = pgEnum("agent_type", [
  "rh",
  "marketing",
  "comercial",
  "financeiro",
  "administrativo",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "token_warning",
  "token_blocked",
  "subscription_expiring",
  "subscription_canceled",
  "payment_failed",
]);

// ============================================================
// COMPANIES
// ============================================================

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 18 }),
  logoUrl: text("logo_url"),

  // Plano e billing
  plan: planEnum("plan").notNull().default("trial"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("trialing"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  // Tokens
  tokenBalance: bigint("token_balance", { mode: "number" })
    .notNull()
    .default(250000), // trial default
  tokenUsed: bigint("token_used", { mode: "number" }).notNull().default(0),
  tokenLimit: bigint("token_limit", { mode: "number" })
    .notNull()
    .default(250000),

  // Limites do plano
  maxAgents: integer("max_agents").notNull().default(5),
  maxUsers: integer("max_users").notNull().default(999),

  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

  // LGPD
  dataRegion: varchar("data_region", { length: 50 })
    .notNull()
    .default("sa-east-1"),
  deletionScheduledAt: timestamp("deletion_scheduled_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// COMPANY BRIEFINGS (Layer 1 — identidade da empresa)
// ============================================================

export const companyBriefings = pgTable("company_briefings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" })
    .unique(),

  // Dados coletados pelo onboarding com Claude
  companyName: text("company_name"),
  segment: text("segment"),
  mission: text("mission"),
  values: text("values"),
  communicationTone: text("communication_tone"), // formal | informal | técnico | amigável
  targetAudience: text("target_audience"),
  mainProducts: text("main_products"),
  additionalContext: text("additional_context"),

  // System prompt compilado (Layer 1)
  compiledPrompt: text("compiled_prompt"),

  // Status do onboarding
  isComplete: boolean("is_complete").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// AGENTS
// ============================================================

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    type: agentTypeEnum("type").notNull(),
    customName: varchar("custom_name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),

    // Layer 2 briefing reference
    briefingId: uuid("briefing_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.companyId, table.type),
    index("agents_company_idx").on(table.companyId),
  ]
);

// ============================================================
// AGENT BRIEFINGS (Layer 2 — contexto do setor)
// ============================================================

export const agentBriefings = pgTable("agent_briefings", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" })
    .unique(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),

  // Conteúdo do briefing de setor
  sectorContext: text("sector_context"),
  specificInstructions: text("specific_instructions"),
  restrictedTopics: text("restricted_topics"),
  preferredExamples: text("preferred_examples"),

  // System prompt compilado (Layer 1 + Layer 2)
  compiledPrompt: text("compiled_prompt"),

  isComplete: boolean("is_complete").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // Sync com Supabase Auth UUID
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),

    email: varchar("email", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("employee"),

    // Para Responsável de Setor: qual agente ele gerencia
    managedAgentType: agentTypeEnum("managed_agent_type"),

    isActive: boolean("is_active").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_company_idx").on(table.companyId)]
);

// ============================================================
// INVITES (Convite de funcionários por e-mail)
// ============================================================

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
]);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    email: varchar("email", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("employee"),
    token: varchar("token", { length: 64 }).notNull().unique(),
    status: inviteStatusEnum("status").notNull().default("pending"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("invites_company_idx").on(table.companyId),
    index("invites_token_idx").on(table.token),
  ]
);

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;

// ============================================================
// SESSIONS (Conversas com agentes)
// ============================================================

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),

    title: text("title"), // gerado automaticamente após 1a mensagem
    isActive: boolean("is_active").notNull().default(true),

    // Tokens consumidos nesta sessão
    tokensUsed: integer("tokens_used").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_company_idx").on(table.companyId),
    index("sessions_user_idx").on(table.userId),
    index("sessions_agent_idx").on(table.agentId),
  ]
);

// ============================================================
// MESSAGES
// ============================================================

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),

    // Tokens desta mensagem
    tokensInput: integer("tokens_input").notNull().default(0),
    tokensOutput: integer("tokens_output").notNull().default(0),
    tokensTotal: integer("tokens_total").notNull().default(0),

    // Modelo Claude usado
    model: varchar("model", { length: 100 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_session_idx").on(table.sessionId),
    index("messages_company_idx").on(table.companyId),
  ]
);

// ============================================================
// UPLOADS (para agentes com suporte a arquivos - Sprint 4)
// ============================================================

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),

    fileName: varchar("file_name", { length: 500 }).notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    storagePath: text("storage_path").notNull(), // Supabase Storage path
    publicUrl: text("public_url"),

    // Transcrição (Whisper - Sprint 4)
    transcription: text("transcription"),
    transcriptionStatus: varchar("transcription_status", { length: 50 }).default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("uploads_company_idx").on(table.companyId)]
);

// ============================================================
// TOKEN PACKS (compras avulsas)
// ============================================================

export const tokenPacks = pgTable("token_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),

  tokens: bigint("tokens", { mode: "number" }).notNull().default(2000000),
  amountPaid: integer("amount_paid").notNull(), // em centavos BRL
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending | paid | failed

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_company_idx").on(table.companyId),
    index("notifications_user_idx").on(table.userId),
  ]
);

// ============================================================
// RAG — Documentos e Chunks para Retrieval-Augmented Generation
// ============================================================

/**
 * Documentos indexados por empresa/agente.
 * Os chunks com embeddings ficam na tabela rag_chunks (gerenciada via Supabase client
 * diretamente, pois Drizzle não suporta o tipo vector do pgvector nativamente).
 */
export const ragDocuments = pgTable(
  "rag_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(), // 'pdf' | 'docx' | 'txt' | 'csv'
    storagePath: text("storage_path"),
    chunkCount: integer("chunk_count").default(0),
    status: text("status").notNull().default("processing"), // 'processing' | 'ready' | 'error'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("rag_documents_company_idx").on(table.companyId),
    index("rag_documents_agent_idx").on(table.agentId),
  ]
);

/**
 * Chunks de texto — espelho do schema SQL (sem a coluna embedding vector(512),
 * que é gerenciada fora do Drizzle via Supabase client).
 */
export const ragChunks = pgTable(
  "rag_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => ragDocuments.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("rag_chunks_company_idx").on(table.companyId),
    index("rag_chunks_agent_idx").on(table.agentId),
  ]
);

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type CompanyBriefing = typeof companyBriefings.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type AgentBriefing = typeof agentBriefings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type TokenPack = typeof tokenPacks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type RagDocument = typeof ragDocuments.$inferSelect;
export type RagChunk = typeof ragChunks.$inferSelect;
