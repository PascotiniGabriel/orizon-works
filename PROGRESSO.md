# PROGRESSO — Orizon Works
> Atualizado em: 2026-04-15

## Status Geral: MVP funcional em produção (modo teste Stripe) · Design VAPI concluído · RAG implementado

---

## Fase Atual: **Fase 3 — Refinamento & Pré-produção**

| Fase | Descrição | Status |
|------|-----------|--------|
| Fase 1 | Core do produto (auth, onboarding, agentes, chat) | ✅ Concluída |
| Fase 2 | Features adicionais (histórico, convites, ranking RH, token pack) | ✅ Concluída |
| Fase 3 | Design system definitivo + refinamentos UX + pré-produção + RAG | 🔄 Em andamento |
| Fase 4 | Stripe produção + Super Admin gestão + Features premium | ⏳ Próxima |

---

## UI/UX — Design System VAPI (Concluído em Abr/2025)

Redesign completo da interface, inspirado no VAPI. Quarta iteração — versão definitiva.

### Sistema de Cores
- Background principal: `#111111` · Sidebar: `#0A0A0A` · Cards: `#161616`
- Accent: Emerald `#10B981` (substituiu amber `#E8A020`)
- Texto primário: `#EBEBEB` · Secundário: `#888` · Labels: `#444`
- Bordas: `rgba(255,255,255,0.07)`

### Componentes Redesenhados
- [x] `AppSidebar` — estrutura VAPI: brand → user account row → nav (AGENTES/PLATAFORMA/GERENCIAR) → footer com token meter
- [x] `ChatInterface` — flush com o fundo, sem box/border, emerald, fontes 16px, header 16px
- [x] `AgentCommandList` — lista de linhas (não cards): ícone 40px · nome 15px · badge · status · seta
- [x] `NotificationBell` — emerald, dropdown posicionado fora da sidebar
- [x] `TokenPackButton` — emerald (era amber)
- [x] Auth layout — dois painéis: brand esquerda 400px + formulário direita
- [x] Login / Cadastro — inputs 46px, fontes aumentadas, emerald
- [x] Escritório — page-header bar 52px, stat cards, lista de agentes
- [x] Histórico — page-header bar, lista de sessões com `.ow-row`
- [x] Configurações — page-header bar, cards #161616, oferta de tokens em emerald, conteúdo centralizado
- [x] Admin — page-header bar, status styles emerald
- [x] `historico/[sessionId]/page.tsx` — dark layout, ícone do agente por tipo, bolhas emerald
- [x] `recuperar-senha/page.tsx` — formulário nativo, emerald, sem shadcn Card
- [x] `convite/[token]/page.tsx` + `AcceptInviteForm.tsx` — fundo #0A0A0A, card emerald

### Padrão de Página (page-header bar)
- Altura: `52px` · `borderBottom: 1px solid rgba(255,255,255,0.06)`
- Título h1: `17px`, `fontWeight: 600`
- Conteúdo interno: `maxWidth: "860px"`, `margin: "0 auto"` para centralizar

### CSS Utilitários (globals.css)
- `.ow-nav:hover` — hover para itens de navegação (compatível com RSC)
- `.ow-row:hover` — hover para linhas de lista (compatível com RSC)

### Escala de Fontes Estabelecida
`11px` labels → `13px` meta → `14px` nav/form → `15px` body/nome → `16px` mensagens/headers → `17px` page titles → `22px` chat heading → `26px` auth headings → `30px` auth headline

---

## Funcionalidades Implementadas

### Autenticação e Cadastro
- [x] Cadastro com criação automática de empresa no banco
- [x] Login email/senha via Supabase Auth
- [x] Recuperação de senha (formulário nativo, emerald, sem shadcn)
- [x] Auto-login após cadastro
- [x] Trigger conflitante `on_auth_user_created` removido do Supabase
- [x] RLS policies `service_role_all` adicionadas nas 10 tabelas
- [x] Rollback completo no cadastro (remove auth user + company + user em caso de falha)
- [x] Planos pagos redirecionam para Stripe Checkout (7 dias grátis, cartão obrigatório)
- [x] Trial vai direto para onboarding sem pagamento

### Planos e Stripe
- [x] 4 planos: Trial, Starter, Growth, Business
- [x] Stripe em modo TESTE (`sk_test_...`)
- [x] Webhook `/api/webhooks/stripe` — trata `subscription.created`, `subscription.updated`, `subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [x] Token Pack one-time — Stripe Checkout + webhook credita 2M tokens imediatamente
- [ ] Stripe modo PRODUÇÃO — pendente ativação da conta real

### Onboarding
- [x] Briefing da empresa via chat com Claude (6 perguntas)
- [x] Briefing do agente por setor via chat com Claude
- [x] Upload de documentos PDF no onboarding
- [x] Salva `compiledPrompt` no banco
- [x] Redireciona para `/escritorio` após conclusão

### Escritório / Chat com Agentes
- [x] Dashboard com lista de agentes (design VAPI)
- [x] Chat com streaming em tempo real
- [x] Controle de tokens: bloqueia ao esgotar, exibe saldo
- [x] Tokens atualizam automaticamente após cada resposta
- [x] Markdown renderizado nas respostas
- [x] Textarea auto-expansível
- [x] Exportação para PDF (jsPDF) e Word (docx)
- [x] Upload de arquivos e transcrição de áudio (Groq Whisper Large v3)
- [x] Histórico de sessões por usuário
- [x] RBAC: employee vê só suas sessões, admin/manager vê todas

### Modo Guiado (Engenheiro de Prompt)
- [x] Modal com 6 campos estruturados
- [x] Melhoria automática via Claude antes de enviar
- [x] Em destaque no empty state do chat

### Modo Simples (Engenheiro de Prompt)
- [x] Enriquecimento automático de prompts no backend (transparente ao usuário)

### Empty State do Chat
- [x] Sugestões de prompts por tipo de agente (RH, Marketing, Comercial, Financeiro, Administrativo)
- [x] Modo Guiado com card explicativo para iniciantes
- [x] Clique nas sugestões preenche o campo automaticamente

### Painel RH — Ranking de Currículos
- [x] Workspace em `/escritorio/chat/[agentId]/avaliar`
- [x] Input de vaga + até 20 currículos em texto
- [x] Avaliação via Claude Haiku: nota 0-10, pontos fortes/fracos, recomendação
- [x] 4 categorias: Contratar, 2ª Entrevista, Banco de Reserva, Não segue
- [x] Cards rankeados expandíveis
- [x] Débito de tokens por avaliação
- [ ] Upload de PDF de currículo
- [ ] Exportar ranking para Excel/PDF
- [ ] Avaliação de áudio de entrevista

### Sistema de Convites
- [x] Tabela `invites` com token, expiração, status, role
- [x] Modal "Convidar funcionário" para admins
- [x] Seleção de função: Funcionário ou Responsável de Setor
- [x] Página `/convite/[token]` para criação de conta do convidado (dark design)
- [x] Validação: token expirado, já aceito, e-mail duplicado

### Configurações (Admin)
- [x] Consumo de tokens com barra visual e formatação correta (floor, não round)
- [x] Resumo do mês: sessões, mensagens, tokens, usuários ativos
- [x] Uso por agente com ícones coloridos
- [x] Lista de usuários com role badge, último acesso e sessões
- [x] Botão "Convidar funcionário" funcional
- [x] Design VAPI: page-header bar, cards #161616, oferta emerald, conteúdo centralizado

### Sidebar — Correções de UX
- [x] Token display: `Math.floor` com 2 decimais — mostra `3.49M` não `3.5M`
- [x] Botão "Comprar tokens" navega para `/configuracoes` (era morto)
- [x] Texto "X% restante" visível — cor `#666` (era `#2A2A2A`, invisível)
- [x] Ícone do sino visível — cor `#666` (era `#3A3A3A`, invisível)

### RAG — Base de Conhecimento por Agente

- [x] Tabelas `rag_documents` e `rag_chunks` no schema Drizzle (+ SQL pgvector no Supabase)
- [x] Embeddings via Voyage AI API HTTP (`voyage-3-lite`, dim 512) — `src/lib/rag/embeddings.ts`
- [x] Chunking de documentos (`@langchain/textsplitters`, 800 chars, overlap 100) — `src/lib/rag/chunking.ts`
- [x] Busca semântica via `search_rag_chunks()` SQL function + cosine similarity — `src/lib/rag/search.ts`
- [x] Queries auxiliares (check, list, delete) — `src/lib/db/queries/rag.ts`
- [x] `/api/rag/ingest` — indexa documentos em background (chunk → embed → insert pgvector)
- [x] `/api/rag/delete` — remove documento e chunks (CASCADE)
- [x] `/api/rag/list` — lista documentos por empresa/agente
- [x] `/api/upload` — dispara indexação RAG automaticamente após upload de PDF/CSV/TXT
- [x] `/api/chat` — busca RAG antes de chamar Claude, injeta trechos relevantes no system prompt
- [x] `/escritorio/chat/[agentId]/documentos` — painel de gestão com upload, status, delete e polling
- [x] Link "Base de Conhecimento" na action bar do chat (admin/manager)
- [x] Supabase Storage bucket `company-documents` — **criado** (private, 10 MB limit)

**Notas técnicas:**
- Embeddings via HTTP direto (evita problema ESM do SDK voyageai no Turbopack)
- Falha silenciosa: se RAG falhar, o chat continua sem RAG
- Apenas PDF, CSV, TXT geram indexação (áudio usa transcrição separada)
- `VOYAGE_API_KEY` obrigatória para funcionar (se ausente, upload funciona mas sem RAG)
- next.config.ts: `serverExternalPackages: ["@langchain/textsplitters"]`

**SQL necessário no Supabase (rodar no SQL Editor):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, file_type TEXT NOT NULL, storage_path TEXT,
  chunk_count INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES users(id)
);
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL, chunk_index INTEGER NOT NULL,
  embedding vector(512), metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX rag_chunks_embedding_idx ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX rag_chunks_company_idx ON rag_chunks(company_id);
CREATE INDEX rag_chunks_agent_idx ON rag_chunks(agent_id);
CREATE INDEX rag_documents_company_idx ON rag_documents(company_id);
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON rag_documents FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON rag_chunks FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION search_rag_chunks(
  query_embedding vector(512), filter_company_id UUID,
  filter_agent_id UUID DEFAULT NULL, match_count INTEGER DEFAULT 5, match_threshold FLOAT DEFAULT 0.5
) RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT rc.id, rc.content, rc.metadata,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM rag_chunks rc
  WHERE rc.company_id = filter_company_id
    AND (filter_agent_id IS NULL OR rc.agent_id = filter_agent_id OR rc.agent_id IS NULL)
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding LIMIT match_count;
END; $$;
```

### Painel Super Admin (`/admin`)
- [x] Visão de todas as empresas com métricas
- [x] Filtro por status de assinatura
- [x] MRR estimado, total de usuários, tokens consumidos
- [ ] Editar limite de tokens por empresa
- [ ] Alterar plano de empresa
- [ ] Cancelar / reativar assinatura manualmente

### Sistema de Notificações
- [x] NotificationBell no header: sino + badge + dropdown
- [x] Marcar notificações como lidas (`/api/notifications/read`)

---

## Estrutura de Arquivos

```
orizon-works/src/
├── middleware.ts                               ✅ Proteção de rotas + redirect login
├── actions/
│   ├── auth.ts                                ✅
│   ├── invites.ts                             ✅
│   ├── sector.ts                              ✅
│   ├── tokens.ts                              ✅
│   └── uploads.ts                             ✅
├── app/
│   ├── (app)/
│   │   ├── admin/page.tsx                     ✅ Super Admin (KPIs + empresas)
│   │   ├── configuracoes/page.tsx             ✅ Painel Admin Empresa
│   │   ├── escritorio/
│   │   │   ├── page.tsx                       ✅ Dashboard agentes
│   │   │   ├── chat/[agentId]/
│   │   │   │   ├── page.tsx                   ✅ Chat com agente
│   │   │   │   └── avaliar/page.tsx           ✅ Ranking de Currículos (RH)
│   │   │   └── historico/
│   │   │       ├── page.tsx                   ✅ Lista de sessões
│   │   │       └── [sessionId]/page.tsx       ✅ Detalhe sessão (read-only, dark)
│   │   └── layout.tsx                         ✅ Shell (sidebar + header)
│   ├── (auth)/
│   │   ├── login/page.tsx                     ✅
│   │   ├── cadastro/page.tsx                  ✅
│   │   ├── recuperar-senha/page.tsx           ✅ (redesign: nativo sem shadcn)
│   │   └── convite/[token]/
│   │       ├── page.tsx                       ✅ (redesign: dark VAPI)
│   │       └── AcceptInviteForm.tsx           ✅ (redesign: dark, emerald)
│   ├── (onboarding)/                          ✅
│   └── api/
│       ├── chat/
│       │   ├── route.ts                       ✅ Chat streaming + Modo Simples
│       │   └── engenheiro/route.ts            ✅ Modo Guiado — agente revisor
│       ├── notifications/read/route.ts        ✅
│       ├── onboarding/route.ts                ✅
│       ├── onboarding/setor/route.ts          ✅
│       ├── transcribe/route.ts                ✅ Groq Whisper transcrição
│       ├── upload/route.ts                    ✅ Upload Supabase Storage
│       └── webhooks/stripe/route.ts           ✅
├── components/
│   ├── app/
│   │   ├── AppHeader.tsx                      ✅
│   │   ├── AppSidebar.tsx                     ✅ VAPI design completo
│   │   ├── ChatInterface.tsx                  ✅ export + upload + Modo Guiado
│   │   ├── FileUploadButton.tsx               ✅
│   │   ├── NotificationBell.tsx               ✅ emerald, visível
│   │   ├── PromptBuilderModal.tsx             ✅ Modal Modo Guiado
│   │   └── TokenPackButton.tsx                ✅ emerald
│   ├── onboarding/                            ✅
│   └── ui/                                    ✅ (shadcn — usado só onde necessário)
└── lib/
    ├── claude/
    │   ├── prompt-builder.ts                  ✅
    │   └── prompt-engineer.ts                 ✅
    ├── db/
    │   ├── schema.ts                          ✅
    │   ├── index.ts                           ✅
    │   └── queries/
    │       ├── admin.ts                       ✅ Stats empresa + Super Admin
    │       ├── agents.ts                      ✅
    │       ├── company.ts                     ✅
    │       ├── rag.ts                         ✅ check/list/delete RAG documents
    │       ├── sessions.ts                    ✅
    │       └── tokens.ts                      ✅
    ├── export.ts                              ✅ PDF (jsPDF) + Word (docx)
    ├── rag/
    │   ├── embeddings.ts                      ✅ Voyage AI HTTP (voyage-3-lite)
    │   ├── chunking.ts                        ✅ RecursiveCharacterTextSplitter
    │   └── search.ts                          ✅ Busca semântica + formatRagContext
    ├── stripe/                                ✅
    └── supabase/                              ✅
```

---

## Deploy e Infraestrutura

| Item | Status | Detalhe |
|------|--------|---------|
| Vercel Deploy | ✅ Ativo | https://orizon-works-zeta.vercel.app |
| GitHub | ✅ Público | https://github.com/PascotiniGabriel/orizon-works |
| Supabase Auth | ✅ Ativo | — |
| Supabase Storage | ⚠️ Pendente | Bucket `company-documents` (Private) — criar manualmente no dashboard |
| Stripe Webhook (teste) | ✅ Ativo | modo teste |
| Groq API | ✅ Configurado | Whisper Large v3 para transcrição de áudio |
| Stripe → Produção | ⏳ Pendente | Trocar chaves test→live e recriar webhook |

### Variáveis de Ambiente (todas configuradas na Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`, `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_TOKEN_PACK`
- `GROQ_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV`

### Processo de Deploy para Produção (Stripe)
1. No Stripe Dashboard → clicar em "Alternar para conta de produção"
2. Copiar chaves live (`sk_live_...`, `pk_live_...`) → atualizar na Vercel
3. Recriar o webhook com URL `https://orizon-works-zeta.vercel.app/api/webhooks/stripe`
4. Atualizar `STRIPE_WEBHOOK_SECRET` na Vercel com novo `whsec_...`
5. Recriar Price IDs dos planos em modo produção → atualizar `STRIPE_PRICE_*` na Vercel

---

## SQL Necessário no Supabase (Rodar no SQL Editor)

```sql
-- Tabela de convites (caso não exista)
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  token VARCHAR(64) NOT NULL UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invites_company_idx ON invites(company_id);
CREATE INDEX invites_token_idx ON invites(token);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON invites FOR ALL TO postgres USING (true) WITH CHECK (true);
```

---

## Pendências por Prioridade

### Alta
- [ ] **Super Admin — gestão de empresas**: editar limite de tokens, alterar plano, cancelar/reativar assinatura manualmente
- [ ] **RAG — SQL no Supabase**: rodar o SQL acima para criar tabelas pgvector + function de busca
- [ ] **RAG — VOYAGE_API_KEY**: obter chave em dash.voyageai.com e configurar na Vercel + .env.local

### Média
- [x] Supabase Storage bucket `company-documents` — criado (private, 10 MB)
- [ ] Stripe webhook configurado em produção
- [ ] Stripe modo produção (conta ativa, preços reais, env vars de produção)
- [ ] Termos de Uso e Política de Privacidade (obrigatório para Stripe produção)
- [ ] Rate limiting nas APIs de chat e upload
- [ ] Painel RH: upload de PDF de currículo (suporte a 100+ currículos por vaga)

### Baixa
- [ ] `sector_manager` — enforcement real por agente na API de chat
- [ ] Exportar ranking RH para Excel/PDF
- [ ] Avaliação de áudio de entrevista (transcrição + análise)
- [ ] Audit log de ações administrativas
- [ ] 2FA para admins

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS (utilitários mínimos — inline styles predominam) |
| Backend | Next.js Server Actions + API Routes |
| Banco de dados | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Supabase Auth |
| IA | Anthropic Claude (Haiku para onboarding/ranking, Sonnet para agentes) |
| Pagamentos | Stripe (modo teste → produção pendente) |
| Deploy | Vercel (auto-deploy via push na main) |
| Storage | Supabase Storage |
| Transcrição | Groq (Whisper Large v3) |
| Embeddings RAG | Voyage AI HTTP (`voyage-3-lite`, dim 512) |
| Chunking RAG | @langchain/textsplitters |
| Vector DB | pgvector no Supabase PostgreSQL |
| Ícones | Lucide React |
| Export | jsPDF (PDF) + docx (Word) |

---

## Bugs Corrigidos

| Data | Bug | Correção |
|------|-----|----------|
| Abr/08 | Página raiz mostrava boilerplate Next.js | `middleware.ts` + redirect para `/login` |
| Abr/08 | Trial dizia "sem cartão" | Corrigido para "cartão obrigatório" |
| Abr/08 | Transcrição usava OpenAI Whisper | Migrado para Groq (`whisper-large-v3`) |
| Abr/08 | Cadastro com plano pago falhava no Stripe | `payment_behavior: default_incomplete` |
| Abr/15 | Token display "3.5M" (arredondamento errado) | `Math.floor(n/10_000)/100` → mostra `3.49M` |
| Abr/15 | "Comprar tokens" sem destino (botão morto) | Trocado para `<Link href="/configuracoes">` |
| Abr/15 | "100% restante" invisível | Cor `#2A2A2A` → `#666` |
| Abr/15 | Ícone sino invisível quando sem notificações | Cor `#3A3A3A` → `#666` |
| Abr/15 | TokenPackButton ainda amber | `#E8A020` → `#10B981` |
| Abr/15 | Configurações descentralizadas após redesign | `margin: "0 auto"` no container interno |

---

## Histórico de Sessões

| Data | O que foi feito |
|------|----------------|
| Abr/06 | Planejamento, scaffold, PRD, stack |
| Abr/07 | Auth, onboarding, chat, Stripe, webhook, RBAC, histórico |
| Abr/07 | Modo Guiado, empty state, ranking RH, convites, Token Pack, Admin |
| Abr/07 | Upload de arquivos, Groq Whisper, exportação PDF/Word, notificações |
| Abr/08 | Deploy Vercel, integração Groq, webhook Stripe, bugfixes pós-deploy |
| Abr/15 | Redesign UI #1–#2: amber → emerald, sidebar VAPI, lista de agentes |
| Abr/15 | Redesign UI #3: ChatInterface, fontes globais (+2 notches em todas as páginas) |
| Abr/15 | Configurações redesenhada · fixes sidebar (tokens, botão, visibilidade) |
| Abr/15 | Redesign páginas restantes: historico/[sessionId], recuperar-senha, convite/[token] |
| Abr/15 | RAG completo: embeddings Voyage AI + pgvector + painel de documentos + integração no chat |
