-- ============================================================
-- Orizon Works — RLS Policies + Auth Trigger
-- Executar uma vez após criar as tabelas (pnpm db:push)
-- ============================================================

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Retorna company_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna role do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TRIGGER: Sincronizar auth.users → public.users
-- Cria linha em public.users quando alguém se cadastra
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_app_meta_data->>'role')::public.user_role, 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- ============================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_briefings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_briefings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: companies
-- ============================================================

DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id());

DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    id = public.get_user_company_id()
    AND public.get_user_role() = 'company_admin'
  );

-- INSERT apenas via service role (cadastro no servidor)

-- ============================================================
-- POLICIES: company_briefings
-- ============================================================

DROP POLICY IF EXISTS "company_briefings_select" ON public.company_briefings;
CREATE POLICY "company_briefings_select" ON public.company_briefings
  FOR SELECT USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "company_briefings_insert" ON public.company_briefings;
CREATE POLICY "company_briefings_insert" ON public.company_briefings
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.get_user_role() = 'company_admin'
  );

DROP POLICY IF EXISTS "company_briefings_update" ON public.company_briefings;
CREATE POLICY "company_briefings_update" ON public.company_briefings
  FOR UPDATE USING (
    company_id = public.get_user_company_id()
    AND public.get_user_role() = 'company_admin'
  );

-- ============================================================
-- POLICIES: users
-- ============================================================

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- POLICIES: agents
-- ============================================================

DROP POLICY IF EXISTS "agents_select" ON public.agents;
CREATE POLICY "agents_select" ON public.agents
  FOR SELECT USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "agents_insert" ON public.agents;
CREATE POLICY "agents_insert" ON public.agents
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.get_user_role() = 'company_admin'
  );

DROP POLICY IF EXISTS "agents_update" ON public.agents;
CREATE POLICY "agents_update" ON public.agents
  FOR UPDATE USING (
    company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('company_admin', 'sector_manager')
  );

-- ============================================================
-- POLICIES: agent_briefings
-- ============================================================

DROP POLICY IF EXISTS "agent_briefings_select" ON public.agent_briefings;
CREATE POLICY "agent_briefings_select" ON public.agent_briefings
  FOR SELECT USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "agent_briefings_insert" ON public.agent_briefings;
CREATE POLICY "agent_briefings_insert" ON public.agent_briefings
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('company_admin', 'sector_manager')
  );

DROP POLICY IF EXISTS "agent_briefings_update" ON public.agent_briefings;
CREATE POLICY "agent_briefings_update" ON public.agent_briefings
  FOR UPDATE USING (
    company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('company_admin', 'sector_manager')
  );

-- ============================================================
-- POLICIES: sessions
-- Funcionário vê apenas as próprias; manager/admin veem todas da empresa
-- ============================================================

DROP POLICY IF EXISTS "sessions_select" ON public.sessions;
CREATE POLICY "sessions_select" ON public.sessions
  FOR SELECT USING (
    company_id = public.get_user_company_id()
    AND (
      user_id = auth.uid()
      OR public.get_user_role() IN ('company_admin', 'sector_manager')
    )
  );

DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;
CREATE POLICY "sessions_insert" ON public.sessions
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
CREATE POLICY "sessions_update" ON public.sessions
  FOR UPDATE USING (
    company_id = public.get_user_company_id()
    AND user_id = auth.uid()
  );

-- ============================================================
-- POLICIES: messages
-- Herda visibilidade da sessão
-- ============================================================

DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = messages.session_id
      AND (
        s.user_id = auth.uid()
        OR public.get_user_role() IN ('company_admin', 'sector_manager')
      )
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = messages.session_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: uploads
-- ============================================================

DROP POLICY IF EXISTS "uploads_select" ON public.uploads;
CREATE POLICY "uploads_select" ON public.uploads
  FOR SELECT USING (
    company_id = public.get_user_company_id()
    AND (
      user_id = auth.uid()
      OR public.get_user_role() IN ('company_admin', 'sector_manager')
    )
  );

DROP POLICY IF EXISTS "uploads_insert" ON public.uploads;
CREATE POLICY "uploads_insert" ON public.uploads
  FOR INSERT WITH CHECK (
    company_id = public.get_user_company_id()
    AND user_id = auth.uid()
  );

-- ============================================================
-- POLICIES: token_packs
-- ============================================================

DROP POLICY IF EXISTS "token_packs_select" ON public.token_packs;
CREATE POLICY "token_packs_select" ON public.token_packs
  FOR SELECT USING (
    company_id = public.get_user_company_id()
    AND public.get_user_role() = 'company_admin'
  );

-- ============================================================
-- POLICIES: notifications
-- ============================================================

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (
    company_id = public.get_user_company_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (
    company_id = public.get_user_company_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );
