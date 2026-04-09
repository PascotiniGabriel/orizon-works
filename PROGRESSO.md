# PROGRESSO — OrizonWorks

## Status Geral: MVP funcional em produção (modo teste)

---

## Funcionalidades Implementadas

### Autenticação e Cadastro
- [x] Cadastro com criação automática de empresa no banco
- [x] Login email/senha via Supabase Auth
- [x] Recuperação de senha
- [x] Auto-login após cadastro
- [x] Trigger conflitante `on_auth_user_created` removido do Supabase
- [x] RLS policies `service_role_all` adicionadas nas 10 tabelas (acesso server-side)
- [x] Rollback completo no cadastro: remove auth user + company + user em caso de falha
- [x] Planos pagos redirecionam para Stripe Checkout (7 dias grátis, cartão obrigatório)
- [x] Trial vai direto para onboarding sem pagamento

### Planos e Stripe
- [x] 4 planos: Trial, Starter, Growth, Business
- [x] Stripe em modo TESTE (chaves `sk_test_...`)
- [x] Webhook `/api/webhooks/stripe` — trata `subscription.created`, `subscription.updated`, `subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Stripe modo PRODUÇÃO — pendente ativação da conta real

### Onboarding (Configuração Inicial)
- [x] Camada 1: Briefing da empresa (6 perguntas via chat com Claude)
- [x] Camada 2: Briefing do agente por setor (via chat com Claude)
- [x] Salva `compiledPrompt` no banco para uso nos agentes
- [x] Redireciona para `/escritorio` após conclusão

### UI/UX Geral
- [x] Sidebar com SVG icons (Lucide) por tipo de agente — sem emojis
- [x] Cards de agentes com gradientes coloridos por setor
- [x] Design Soft UI Evolution: bordas sutis, sombras leves, hierarquia clara
- [x] Escritório com grid de cards melhorado (hover lift, badge de status, descrição por tipo)
- [x] Saudação dinâmica (bom dia/boa tarde/boa noite)

### Escritório / Chat com Agentes
- [x] Dashboard com lista de agentes configurados
- [x] Chat com streaming em tempo real
- [x] Controle de tokens: bloqueia ao esgotar, exibe saldo no header
- [x] Tokens atualizam automaticamente após cada resposta (sem recarregar página)
- [x] Markdown renderizado corretamente nas respostas (sem `##` visível)
- [x] Textarea auto-expansível (cresce conforme o usuário digita)
- [x] Exportação das conversas para PDF e Word
- [x] Upload de arquivos e transcrição de áudio
- [x] Histórico de sessões por usuário
- [x] RBAC: employee vê só suas sessões, admin/manager vê todas

### Modo Guiado (Engenheiro de Prompt)
- [x] Modal com 6 campos estruturados (personagem, tarefa, contexto, exemplo, formato, tom)
- [x] Melhoria automática do prompt via Claude antes de enviar ao agente
- [x] Em destaque no empty state do chat
- [x] Botão na tela inicial do chat para usuários sem experiência em IA

### Empty State do Chat
- [x] Sugestões de prompts específicas por tipo de agente (RH, Marketing, Comercial, Financeiro, Administrativo)
- [x] Modo Guiado em destaque com explicação para quem nunca usou IA
- [x] Clique nas sugestões preenche o campo de mensagem automaticamente

### Painel de RH — Ranking de Currículos
- [x] Workspace dedicado em `/escritorio/chat/[agentId]/avaliar`
- [x] Botão "Ranking de Currículos" no header do chat do agente RH
- [x] Input de descrição da vaga + até 20 currículos (texto colado)
- [x] Processamento via Claude Haiku: nota 0-10, pontos fortes, pontos fracos, recomendação
- [x] 4 categorias de recomendação: Contratar, 2ª Entrevista, Banco de Reserva, Não segue
- [x] Cards rankeados expandíveis com sumário visual por categoria
- [x] Debito de tokens por avaliação
- [ ] Upload de PDF de currículo (conversão texto pendente)
- [ ] Exportar ranking para Excel/PDF
- [ ] Avaliação de áudio de entrevista (transcrição + análise)

### Sistema de Convites (Funcionários)
- [x] Tabela `invites` no schema (token, expiração, status, role)
- [x] Server action `createInvite`: valida, gera token, salva, envia e-mail via Supabase Auth
- [x] Modal "Convidar funcionário" em Configurações (ativo para admins)
- [x] Seleção de função: Funcionário ou Responsável de Setor
- [x] Página `/convite/[token]` para o convidado criar a conta
- [x] Validação: token expirado, já aceito, e-mail duplicado
- [x] Aceite cria usuário no Supabase Auth + tabela users com role correto
- [ ] **SQL necessário no Supabase**: ver seção abaixo

### Configurações (Admin)
- [x] Consumo de tokens com barra visual
- [x] Resumo do mês: sessões, mensagens, tokens, usuários ativos
- [x] Uso por agente (sessões e tokens) com ícones coloridos
- [x] Lista de usuários com role badge colorido, último acesso e sessões
- [x] Botão "Convidar funcionário" funcional com modal

### Painel Super Admin (`/admin`)
- [x] Visão de todas as empresas
- [x] Métricas da plataforma: empresas, usuários, MRR estimado, tokens consumidos
- [x] Filtro por status de assinatura
- [x] Acesso via SQL: `UPDATE users SET role = 'super_admin' WHERE email = '...'`

---

## SQL Necessário no Supabase (Rodar no SQL Editor)

```sql
-- Enum de status de convite
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

-- Tabela de convites
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

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON invites
  FOR ALL TO postgres USING (true) WITH CHECK (true);
```

---

## Problemas Conhecidos / Pendências

### Alta Prioridade
- [x] Rodar SQL acima no Supabase para criar tabela `invites`
- [ ] Super Admin não consegue editar/gerenciar empresas (só visualiza)
- [x] Compra de Token Pack — Stripe Checkout one-time + webhook credita saldo imediatamente

### Média Prioridade
- [ ] Supabase Storage bucket `company-documents` — pendente criação
- [ ] Rate limiting nas APIs de chat e upload
- [ ] Webhook do Stripe não configurado em produção ainda
- [ ] `sector_manager` — enforcement real por agente na API de chat
- [ ] Painel RH: Upload de PDF de currículo
- [ ] Painel RH: Exportar ranking para Excel
- [ ] Painel RH: Avaliação de áudio de entrevista

### Baixa Prioridade
- [ ] Audit log de ações administrativas
- [ ] 2FA para admins
- [ ] Termos de Uso e Política de Privacidade (obrigatório antes de ir a produção)
- [ ] Stripe modo produção (ativar conta, criar preços de produção, atualizar env vars)

---

## Histórico de Correções (Sessões Anteriores)

| Data | Problema | Solução |
|------|----------|---------|
| Apr/25 | "Database error creating new user" | Removido trigger `on_auth_user_created` + `handle_new_auth_user()` do Supabase |
| Apr/25 | "Failed query: insert into users" | Adicionadas policies `service_role_all` nas 10 tabelas com RLS |
| Apr/25 | "duplicate key violates unique constraint users_email_unique" | Reescrito rollback: agora remove user + company + auth user em caso de falha |
| Apr/25 | Planos pagos sem checkout | Stripe Checkout Session para starter/growth/business; trial vai direto |
| Apr/25 | Markdown `##` aparecendo no chat | `react-markdown` + `remark-gfm` com componentes customizados |
| Apr/25 | Textarea não cresce | Substituído `Input` por `textarea` com auto-resize |
| Apr/25 | Tokens não atualizam | `router.refresh()` após cada resposta completa |
| Apr/25 | Modo Guiado escondido | Destaque no empty state com card explicativo |
| Apr/25 | Emojis como ícones na sidebar | Substituído por Lucide SVG icons com cores por tipo de agente |
| Apr/25 | Botão convidar funcionário desabilitado | Modal funcional + server action + página de aceite `/convite/[token]` |
| Apr/25 | Agente RH só conversava | Adicionado workspace de Ranking de Currículos com avaliação em batch via Claude |

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Next.js Server Actions + API Routes |
| Banco de dados | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Supabase Auth |
| IA | Anthropic Claude (Haiku para onboarding/engenheiro/ranking, Sonnet/Haiku para agentes) |
| Pagamentos | Stripe (modo teste) |
| Deploy | Vercel |
| Storage | Supabase Storage |
| Ícones | Lucide React |
