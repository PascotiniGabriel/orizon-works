# PROGRESSO — Orizon Works

## Status Geral: MVP funcional em produção (modo teste Stripe) · Design VAPI concluído

---

## Fase Atual: **Fase 3 — Refinamento & Pré-produção**

| Fase | Descrição | Status |
|------|-----------|--------|
| Fase 1 | Core do produto (auth, onboarding, agentes, chat) | ✅ Concluída |
| Fase 2 | Features adicionais (histórico, convites, ranking RH, token pack) | ✅ Concluída |
| Fase 3 | Design system definitivo + refinamentos UX + pré-produção | 🔄 Em andamento |
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
- [x] Histórico — page-header bar, lista de sessões com .ow-row
- [x] Configurações — page-header bar, cards #161616, oferta de tokens em emerald
- [x] Admin — page-header bar, status styles emerald

### CSS Utilitários (globals.css)
- `.ow-nav:hover` — hover para itens de navegação (compatível com RSC)
- `.ow-row:hover` — hover para linhas de lista (compatível com RSC)

### Escala de Fontes Estabelecida
`11px` labels → `13px` meta → `14px` nav/form → `15px` body/nome → `16px` mensagens/headers → `17px` page titles → `22px` chat heading → `26px` auth headings → `30px` auth headline

### Páginas ainda com design antigo (pendentes)
- [ ] `historico/[sessionId]/page.tsx` — detalhe de sessão
- [ ] `recuperar-senha/page.tsx`
- [ ] `convite/[token]/page.tsx` e páginas relacionadas

---

## Funcionalidades Implementadas

### Autenticação e Cadastro
- [x] Cadastro com criação automática de empresa no banco
- [x] Login email/senha via Supabase Auth
- [x] Recuperação de senha
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
- [x] Salva `compiledPrompt` no banco
- [x] Redireciona para `/escritorio` após conclusão

### Escritório / Chat com Agentes
- [x] Dashboard com lista de agentes (design VAPI)
- [x] Chat com streaming em tempo real
- [x] Controle de tokens: bloqueia ao esgotar, exibe saldo
- [x] Tokens atualizam automaticamente após cada resposta
- [x] Markdown renderizado nas respostas
- [x] Textarea auto-expansível
- [x] Exportação para PDF e Word
- [x] Upload de arquivos e transcrição de áudio
- [x] Histórico de sessões por usuário
- [x] RBAC: employee vê só suas sessões, admin/manager vê todas

### Modo Guiado (Engenheiro de Prompt)
- [x] Modal com 6 campos estruturados
- [x] Melhoria automática via Claude antes de enviar
- [x] Em destaque no empty state do chat

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
- [x] Página `/convite/[token]` para criação de conta do convidado
- [x] Validação: token expirado, já aceito, e-mail duplicado

### Configurações (Admin)
- [x] Consumo de tokens com barra visual e formatação correta (floor, não round)
- [x] Resumo do mês: sessões, mensagens, tokens, usuários ativos
- [x] Uso por agente com ícones coloridos
- [x] Lista de usuários com role badge, último acesso e sessões
- [x] Botão "Convidar funcionário" funcional
- [x] Design novo: page-header bar, cards #161616, oferta emerald

### Sidebar — Correções de UX (Abr/2025)
- [x] Token display: `Math.floor` com 2 decimais — mostra `3.49M` não `3.5M`
- [x] Botão "Comprar tokens" navega para `/configuracoes` (era morto)
- [x] Texto "X% restante" visível — cor `#666` (era `#2A2A2A`, invisível)
- [x] Ícone do sino visível — cor `#666` (era `#3A3A3A`, invisível)

### Painel Super Admin (`/admin`)
- [x] Visão de todas as empresas com métricas
- [x] Filtro por status de assinatura
- [x] MRR estimado, total de usuários, tokens consumidos
- [ ] Editar limite de tokens por empresa
- [ ] Alterar plano de empresa
- [ ] Cancelar / reativar assinatura manualmente

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
- [ ] **Super Admin — gestão de empresas**: editar tokens, mudar plano, cancelar/reativar assinatura
- [ ] **Páginas antigas atualizadas**: `historico/[sessionId]`, `recuperar-senha`, `convite/[token]`

### Média
- [ ] Supabase Storage bucket `company-documents` (criar manualmente no dashboard)
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

## Histórico de Sessões

| Data | O que foi feito |
|------|----------------|
| Abr/25 (sessão 1) | Auth, onboarding, chat, Stripe, webhook, RBAC, histórico |
| Abr/25 (sessão 2) | Modo Guiado, empty state, ranking RH, convites, Token Pack, Admin |
| Abr/25 (sessão 3) | Redesign UI #1 e #2 (cor amber → emerald, sidebar VAPI, lista de agentes) |
| Abr/25 (sessão 4) | Redesign UI #3: ChatInterface, fontes globais (+2 notches em todas as páginas) |
| Abr/15 (sessão 5) | Configurações redesenhada · fixes sidebar (tokens, botão, visibilidade) · formatTokens corrigido |

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Next.js Server Actions + API Routes |
| Banco de dados | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Supabase Auth |
| IA | Anthropic Claude (Haiku para onboarding/ranking, Sonnet para agentes) |
| Pagamentos | Stripe (modo teste → produção pendente) |
| Deploy | Vercel (auto-deploy via push na main) |
| Storage | Supabase Storage |
| Ícones | Lucide React |
