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
- [x] Agora em destaque no empty state do chat (não mais escondido)
- [x] Botão na tela inicial do chat para usuários sem experiência em IA

### Empty State do Chat
- [x] Sugestões de prompts específicas por tipo de agente (RH, Marketing, Comercial, Financeiro, Administrativo)
- [x] Modo Guiado em destaque com explicação para quem nunca usou IA
- [x] Clique nas sugestões preenche o campo de mensagem automaticamente

### Configurações (Admin)
- [x] Consumo de tokens com barra visual (últimos 30 dias)
- [x] Resumo do mês: sessões, mensagens, tokens, usuários ativos
- [x] Uso por agente (sessões e tokens)
- [x] Lista de usuários com role, último acesso e sessões
- [x] Botão "Convidar funcionário" (visível, pendente implementação)
- [ ] Sistema de convite real por e-mail — pendente

### Painel Super Admin (`/admin`)
- [x] Visão de todas as empresas
- [x] Métricas da plataforma: empresas, usuários, MRR estimado, tokens consumidos
- [x] Filtro por status de assinatura
- [x] Acesso via SQL: `UPDATE users SET role = 'super_admin' WHERE email = '...'`

---

## Problemas Conhecidos / Pendências

### Alta Prioridade
- [ ] Sistema de convite de funcionários/gerentes por e-mail (página de convite, link com token, definição de role)
- [ ] Super Admin não consegue editar/gerenciar empresas (só visualiza)
- [ ] Compra de Token Pack (botão existe mas não funciona)

### Média Prioridade
- [ ] Supabase Storage bucket `company-documents` — pendente criação
- [ ] Rate limiting nas APIs de chat e upload
- [ ] Webhook do Stripe não configurado em produção ainda
- [ ] `sector_manager` — role existe no schema mas sem enforcement real nem UI para atribuir

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

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Next.js Server Actions + API Routes |
| Banco de dados | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Supabase Auth |
| IA | Anthropic Claude (Haiku para onboarding/engenheiro, Sonnet/Haiku para agentes) |
| Pagamentos | Stripe (modo teste) |
| Deploy | Vercel |
| Storage | Supabase Storage |
