# PROGRESSO — Orizon Works
> Atualizado em: 2026-04-15

## Status Geral: MVP funcional em produção (modo teste Stripe) · Design VAPI concluído · RAG ativo · Todas as prioridades Baixa/Média implementadas

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

### Workspace por Setor (Abas)
- [x] `WorkspaceShell` — 4 abas por agente: Dashboard · Chat · Ferramentas · Documentos
- [x] `WorkspaceDashboard` — KPIs calculados client-side (sem DB): RH, Comercial, Marketing, Financeiro, Administrativo
- [x] `WorkspaceFerramentas` — 13 ferramentas de IA com forms → resultado copiável
- [x] `/api/workspace` — endpoint genérico com 13 prompts especializados por ferramenta
- [x] Aba "Documentos" integrada ao RAG existente (DocumentosClient agora aceita fetch lazy)

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
- [x] Upload de PDF de currículo (drag-and-drop, até 100 PDFs simultâneos)
- [x] Exportar ranking para Excel/PDF (CSV com BOM + PDF via jsPDF)
- [x] Avaliação de áudio de entrevista (Groq Whisper + Claude)

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

- [x] Tabelas `rag_documents` e `rag_chunks` no Supabase com pgvector (`vector(512)`)
- [x] Embeddings via Voyage AI API HTTP (`voyage-3-lite`, dim 512) — `src/lib/rag/embeddings.ts`
- [x] Chunking de documentos (`@langchain/textsplitters`, 800 chars, overlap 100) — `src/lib/rag/chunking.ts`
- [x] Busca semântica via `search_rag_chunks()` SQL function + cosine similarity — `src/lib/rag/search.ts`
- [x] Queries auxiliares (check, list, delete) — `src/lib/db/queries/rag.ts`
- [x] `/api/rag/ingest` — indexa documentos em background (chunk → embed → insert pgvector)
- [x] `/api/rag/delete` — remove documento e chunks (CASCADE)
- [x] `/api/rag/list` — lista documentos por empresa/agente
- [x] `/api/upload` — dispara indexação RAG automaticamente após upload de PDF/CSV
- [x] `/api/chat` — busca RAG antes de chamar Claude, injeta trechos relevantes no system prompt
- [x] `/escritorio/chat/[agentId]/documentos` — painel de gestão com upload, status, delete e polling
- [x] Link "Base de Conhecimento" na action bar do chat (admin/manager)

**Notas técnicas:**
- Embeddings via HTTP direto (evita problema ESM do SDK voyageai no Turbopack)
- Falha silenciosa: se RAG falhar, o chat continua normalmente sem contexto
- Apenas PDF e CSV geram indexação (áudio usa transcrição separada)
- `VOYAGE_API_KEY` configurada em `.env.local` e na Vercel
- `next.config.ts`: `serverExternalPackages: ["@langchain/textsplitters"]`

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
│   │   │   │   ├── avaliar/
│   │   │   │   │   ├── page.tsx               ✅ Painel RH (tabs: currículos + entrevistas)
│   │   │   │   │   ├── CurriculoRankingWorkspace.tsx ✅ Upload PDF + ranking + export CSV/PDF
│   │   │   │   │   └── EntrevistaWorkspace.tsx ✅ Upload áudio + transcrição + análise
│   │   │   │   └── documentos/
│   │   │   │       ├── page.tsx               ✅ Painel RAG (server)
│   │   │   │       └── DocumentosClient.tsx   ✅ Upload + status + delete (client)
│   │   │   └── historico/
│   │   │       ├── page.tsx                   ✅ Lista de sessões
│   │   │       └── [sessionId]/page.tsx       ✅ Detalhe sessão (read-only, dark)
│   │   └── layout.tsx                         ✅ Shell (sidebar + header)
│   ├── (auth)/
│   │   ├── login/page.tsx                     ✅
│   │   ├── cadastro/page.tsx                  ✅
│   │   ├── recuperar-senha/page.tsx           ✅
│   │   └── convite/[token]/
│   │       ├── page.tsx                       ✅
│   │       └── AcceptInviteForm.tsx           ✅
│   ├── (onboarding)/                          ✅
│   ├── termos/page.tsx                        ✅ Termos de Uso (pública, dark design)
│   ├── privacidade/page.tsx                   ✅ Política de Privacidade (pública, LGPD)
│   ├── mfa/page.tsx                           ✅ Verificação TOTP no login (2FA)
│   └── api/
│       ├── chat/
│       │   ├── route.ts                       ✅ Chat streaming + RAG + Modo Simples
│       │   └── engenheiro/route.ts            ✅ Modo Guiado — agente revisor
│       ├── notifications/read/route.ts        ✅
│       ├── onboarding/route.ts                ✅
│       ├── onboarding/setor/route.ts          ✅
│       ├── avaliar-entrevista/route.ts         ✅ Transcrição Groq + análise Claude
│       ├── rag/
│       │   ├── ingest/route.ts                ✅ Indexação background
│       │   ├── delete/route.ts                ✅ Remove documento + chunks (audit log)
│       │   └── list/route.ts                  ✅ Lista por empresa/agente
│       ├── transcribe/route.ts                ✅ Groq Whisper transcrição
│       ├── upload/route.ts                    ✅ Upload Supabase Storage + trigger RAG
│       └── webhooks/stripe/route.ts           ✅
├── components/
│   ├── app/
│   │   ├── AppHeader.tsx                      ✅
│   │   ├── AppSidebar.tsx                     ✅ VAPI design completo
│   │   ├── ChatInterface.tsx                  ✅ export + upload + Modo Guiado
│   │   ├── FileUploadButton.tsx               ✅
│   │   ├── NotificationBell.tsx               ✅
│   │   ├── PromptBuilderModal.tsx             ✅ Modal Modo Guiado
│   │   └── TokenPackButton.tsx                ✅
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
    │       ├── admin.ts                       ✅
    │       ├── agents.ts                      ✅
    │       ├── company.ts                     ✅
    │       ├── rag.ts                         ✅ check/list/delete RAG documents
    │       ├── sessions.ts                    ✅
    │       └── tokens.ts                      ✅
    ├── export.ts                              ✅ PDF (jsPDF) + Word (docx)
    ├── utils/
    │   └── credits.ts                         ✅ tokensToCredits + formatCredits (1 crédito = 1.000 tokens)
    ├── rate-limit.ts                          ✅ checkChatRateLimit / checkUploadRateLimit
    ├── audit.ts                               ✅ logAudit() — audit_logs table
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
| Supabase Storage | ✅ Ativo | Bucket `company-documents` (Private) |
| Supabase pgvector | ✅ Ativo | Tabelas `rag_documents` + `rag_chunks`, function `search_rag_chunks` |
| Stripe Webhook (teste) | ✅ Ativo | modo teste |
| Groq API | ✅ Configurado | Whisper Large v3 para transcrição de áudio |
| Voyage AI | ✅ Configurado | `voyage-3-lite`, `VOYAGE_API_KEY` na Vercel + `.env.local` |
| Stripe → Produção | ⏳ Pendente | Trocar chaves test→live e recriar webhook |

### Variáveis de Ambiente (todas configuradas na Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_TOKEN_PACK`
- `GROQ_API_KEY`, `NEXT_PUBLIC_APP_URL`

### Deploy para Produção (Stripe) — quando ativar conta real
1. No Stripe Dashboard → alternar para conta de produção
2. Copiar chaves live (`sk_live_...`, `pk_live_...`) → atualizar na Vercel
3. Recriar webhook com URL `https://orizon-works-zeta.vercel.app/api/webhooks/stripe`
4. Atualizar `STRIPE_WEBHOOK_SECRET` na Vercel com novo `whsec_...`
5. Recriar Price IDs dos planos em produção → atualizar `STRIPE_PRICE_*` na Vercel

---

## Pendências por Prioridade

### Alta
- [x] **Super Admin — gestão de empresas**: editar limite de tokens, alterar plano, cancelar/reativar assinatura manualmente
- [x] **Editar briefings após onboarding**: página /configuracoes/briefing, campos empresa e agentes
- [x] **Gestão de usuários**: desativar/reativar usuários na tela de configurações
- [x] **Alertas de tokens**: in-app notification + e-mail Resend ao atingir 20% e 0%
- [x] **Landing page**: página de marketing em /
- [x] **Workspace por setor**: abas Dashboard / Chat / Ferramentas / Documentos por agente
- [x] **KPIs client-side**: dashboards calculados no browser para todos os 5 setores
- [x] **13 Ferramentas de IA**: gerador de vaga, PDI, proposta, objeções, calendário, copy, brief, DRE, fluxo de caixa, break-even, ata, resumo de contrato, mapeador de processo
- [x] **Metas configuráveis (workspace_kpis)**: tabela DB + interface admin para definir metas por setor — GoalsPanel no topo de cada dashboard, admin edita inline, persiste no Supabase

### Média
- [ ] Stripe webhook configurado em produção
- [ ] Stripe modo produção (conta ativa, preços reais, env vars de produção)
- [x] Termos de Uso (`/termos`) e Política de Privacidade (`/privacidade`) — páginas públicas, dark design, LGPD
- [x] Rate limiting nas APIs de chat (20 msg/min) e upload (15 uploads/hora) via DB
- [x] Painel RH: upload de PDF de currículo (drag-and-drop, até 100 PDFs simultâneos)

### Baixa
- [x] `sector_manager` — enforcement real: verifica `managedAgentType` antes de processar mensagem na API de chat
- [x] Exportar ranking RH para CSV (abre no Excel) e PDF (jsPDF)
- [x] Avaliação de áudio de entrevista — transcrição Groq Whisper + análise Claude, aba "Entrevistas" no painel RH
- [x] Audit log — tabela `audit_logs` + utilitário `src/lib/audit.ts` + hooks em convites, RAG delete e upload
- [x] 2FA (TOTP) para admins — Supabase MFA, verificação no login (`/mfa`), ativação/desativação nas configurações

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
| Abr/29 | /configuracoes crash 500 em produção | `onMouseEnter`/`onMouseLeave` em Server Component — substituído por `.ow-briefing-card:hover` CSS |
| Abr/29 | Landing page inacessível sem login | `/` não estava em `PUBLIC_PATHS` do middleware; adicionado + redirect para `/escritorio` se logado |

---

## Correções de Segurança e Qualidade — Abr/17

Análise minuciosa do codebase identificou 8 problemas corrigidos abaixo.

### 🔴 Críticos

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `src/lib/db/queries/agents.ts` | `getAgentWithBriefings` buscava agente só por `agentId` sem filtrar por `companyId` — usuário de empresa A poderia acessar agentes da empresa B | Adicionado `and(eq(agents.id, agentId), eq(agents.companyId, companyId))` na query |
| 2 | `src/lib/rag/search.ts` | Conteúdo RAG concatenado diretamente no system prompt sem delimitadores — documentos maliciosos poderiam injetar instruções para o Claude | Envolvido em `<documentos_empresa>` com instrução explícita de tratar como dados, nunca como comandos |

### 🟠 Altos

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 3 | `src/app/api/webhooks/stripe/route.ts` | `checkout.session.completed` sem idempotência — Stripe pode reenviar e creditaria tokens em dobro | Verificação de `stripePaymentIntentId` existente antes de inserir novo `tokenPack` |
| 4 | `src/actions/invites.ts` | `acceptInvite` fazia insert de usuário e update de convite sem transação — estado inconsistente em caso de falha parcial | Envolvido em `db.transaction()` |
| 5 | `src/app/api/webhooks/stripe/route.ts` | Valor de `tokens` lido do metadata Stripe sem validação — metadata corrompido poderia creditar valores absurdos | Validação com `isNaN`, mínimo 1 e máximo 50.000.000 tokens por compra |
| 6 | `src/app/api/rag/ingest/route.ts` | Endpoint verificava auth mas não validava se `documentId` pertencia à empresa do usuário — possível injeção de embeddings em agentes de outras empresas | Busca do documento no banco validando que `companyId` corresponde ao usuário autenticado |

### 🟡 Médios

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 7 | `src/app/api/avaliar-curriculos/route.ts` | CVs truncados em 6.000 chars — descartava experiências e formações em currículos longos | Aumentado para 15.000 chars (~4-5 páginas de CV) |
| 8 | `src/actions/users.ts` + `src/actions/sector.ts` | `AgentType` duplicado como literal union em 2 arquivos — divergência possível com o schema do banco | Derivado do enum Drizzle: `typeof agentTypeEnum.enumValues[number]` |

### ℹ️ Não corrigidos (requerem infraestrutura externa)

| Problema | Motivo | Recomendação |
|----------|--------|--------------|
| Race condition no débito de tokens | Requer `SELECT FOR UPDATE` ou Redis | `GREATEST(..., 0)` já evita saldo negativo; implementar lock pessimista quando Redis estiver disponível |
| Rate limit baseado em banco (burst concorrente) | Rate limit conta mensagens salvas — janela de vulnerabilidade antes do save | Migrar para Redis com contadores atômicos e TTL |

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
| Abr/15 | Rate limiting (chat 20/min, upload 15/hora) · Termos de Uso + Política de Privacidade (LGPD) |
| Abr/15 | sector_manager enforcement · Export ranking CSV/PDF · Avaliação de entrevista por áudio · Audit log · 2FA TOTP |
| Abr/17 | Fix convite (acceptInvite com listUsers Admin API) · Seletor de setor para sector_manager (AssignAgentSelector) |
| Abr/17 | 8 correções de segurança: validação companyId agente, proteção RAG prompt injection, idempotência Stripe, transação acceptInvite, validação tokens Stripe, autorização RAG ingest, PDF currículo 6k→15k chars, AgentType centralizado |
| Abr/17 | Configuração de lembrete automático: CLAUDE.md + hook PostToolUse (git commit) para garantir atualização do PROGRESSO.md |
| Abr/29 | Editar briefings: página /configuracoes/briefing com abas empresa/agentes, server actions updateCompanyBriefing/updateAgentBriefing, link na sidebar |
| Abr/29 | Gestão de usuários: desativar/reativar via UserActionButtons, setUserActiveStatus action, usuários inativos visíveis com opacidade reduzida |
| Abr/29 | Super Admin ações: AdminCompanyActions dropdown por empresa — alterar plano, adicionar tokens, mudar status de assinatura (server actions em src/actions/admin.ts) |
| Abr/29 | Landing page: hero com posicionamento de produto, grade dos 5 agentes, features, pricing com 4 planos, CTA e footer |
| Abr/29 | Alertas de tokens: maybeFireTokenAlerts após cada chat (in-app notification + email Resend), cooldown 12h, alerta em 20% e 0% de saldo |
| Abr/29 | debitTokens retorna tokenLimit; getCompanyUsers inclui isActive e retorna todos os usuários (ativos e inativos) |
| Abr/29 | Fix: ternário duplicado em CurriculoRankingWorkspace (erro TS pré-existente da sessão anterior) |
| Abr/28 | **Workspace por setor**: WorkspaceShell (4 abas: Dashboard/Chat/Ferramentas/Documentos) · WorkspaceDashboard (KPIs calculados client-side para RH/Comercial/Marketing/Financeiro/Administrativo) · WorkspaceFerramentas (13 ferramentas de IA por setor: gerador vaga, PDI, proposta, objeções, calendário, copy, brief, DRE, fluxo caixa, break-even, ata, contrato, processos) · API /api/workspace (13 prompts especializados, debit de tokens) · page.tsx do chat substituído por WorkspaceShell · DocumentosClient com initialDocuments opcional + fetch on mount |
| Abr/29 | **Metas configuráveis**: tabela workspace_kpis no Supabase (via SQL direto, drizzle-kit com bug no push) · queries upsert com onConflictDoUpdate · server actions loadWorkspaceGoals/saveWorkspaceGoals · GoalsPanel client-side no topo de cada dashboard (carrega DB, admins editam inline) · userRole propagado de page.tsx → WorkspaceShell → WorkspaceDashboard |
| Abr/29 | Fix /configuracoes 500 (onMouseEnter em RSC) · Fix landing page pública (middleware) · middleware.ts + page.tsx atualizados · SQL workspace_kpis criado em produção |
| Abr/29 | Renomear tokens → créditos (1 crédito = 1.000 tokens, somente camada de apresentação): `src/lib/utils/credits.ts` (tokensToCredits + formatCredits) · AppSidebar, escritorio/page, configuracoes/page, TokenPackButton, ChatInterface, landing page plans atualizados |
| Abr/29 | Redesign densidade visual A+B+C: 4 stat cards (Agentes/Créditos/Atividade Hoje/Este Mês) · lista de agentes rica com micro-métricas e estado "Configurando" com link · seção Atividade Recente (5 últimas sessões) · B1 empty state escritório com personalidade · B2 empty state histórico melhorado · B3 estado "briefing incompleto" na aba Chat do workspace (WorkspaceShell + ChatPage) · C histórico com busca, filtro por agente, agrupamento por data e preview da primeira mensagem (HistoricoClient.tsx) |
| Abr/29 | Redesign densidade visual D+E+F+G: D1 pulsing dot sessão ativa na sidebar (polling 30s, /api/active-agents) · D3 thresholds créditos corrigidos 15%/30% · E1 barra completude briefing (company + agente, reativa ao salvar) · E2 tooltips ? contextuais por campo · E3 toast "Testar agente agora →" após salvar · F testimonial no painel esquerdo do login · G1 typing dots cor emerald · G2 fadeSlideUp nos stat cards · G3 pulsing dot CSS |
| Abr/29 | **B1 Morning Briefing**: tabelas daily_briefings + agent_tasks no schema · cron `/api/cron/daily-briefing` (8h BRT dias úteis) via Claude Haiku · card "Briefing do dia" no empty state do chat (Foco/Dica/Pergunta + botão Responder) · vercel.json com ambos os crons |
| Abr/29 | **B2 Agent Tasks**: server action createAgentTask/markTaskDone · botão "Criar tarefa" após última msg do assistente → inline form (título + prazo) · widget "Tarefas pendentes" no escritório |
| Abr/29 | **B3 Weekly Summary**: cron `/api/cron/weekly-summary` (17h BRT sextas) · Claude Haiku gera resumo executivo por empresa · notification in-app + email Resend sendWeeklySummaryEmail · notification_type enum + weekly_summary value |
| Abr/30 | Fix cron daily-briefing: strip markdown code blocks do JSON retornado pelo Claude antes do JSON.parse · testado via Hoppscotch → generated: 1, errors: 0 ✓ |
| Abr/30 | **Analytics + ROI (INSTRUÇÃO 2)**: `src/lib/db/queries/analytics.ts` (getMonthlyAnalytics, getDailyActivity, getSixMonthHistory, getTopUsers) · `/analytics` page com 4 stat cards (interações, horas salvas, valor estimado, documentos), barras por agente, sparkline SVG diário, top 3 usuários, tabela histórico 6 meses + nav mês · `AnalyticsExportButton` client (gera PDF via jsPDF) · `/api/analytics/report` (Claude Haiku gera resumo executivo 3 parágrafos) · link Analytics na sidebar (admin/super_admin) · widget "Impacto este mês" em configurações com link para /analytics |
| Abr/30 | **hourly_rate configurável (INSTRUÇÃO 2 item D)**: coluna `hourly_rate NUMERIC(8,2) DEFAULT 35` no schema Drizzle + Supabase · `getUserCompanyInfo` retorna hourlyRate · server action `updateHourlyRate` (src/actions/company.ts) · `HourlyRateInput` client component inline no widget ROI em configurações · analytics page + API report usam valor do DB em vez de hardcoded |
