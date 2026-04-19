-- ============================================================================
-- MIGRATION: Grant Full Access to Admins (Bypass Location Restrictions)
-- ============================================================================
-- Data: 2026-04-19
-- Descrição: Admins devem ter acesso a TODAS as páginas e recursos,
--            independente de bairro/localização
-- ============================================================================

-- ============================================================================
-- ESTRATÉGIA:
-- Adicionar OR is_admin(auth.uid()) em todas as policies que verificam
-- location_id, neighborhood_id, ou qualquer restrição geográfica
-- ============================================================================

-- ============================================================================
-- 1. VAGAS (Jobs)
-- ============================================================================

-- Admins podem ver todas as vagas
DROP POLICY IF EXISTS "Admins can view all vagas" ON vagas;
CREATE POLICY "Admins can view all vagas"
  ON vagas FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem criar vagas
DROP POLICY IF EXISTS "Admins can create vagas" ON vagas;
CREATE POLICY "Admins can create vagas"
  ON vagas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins podem atualizar vagas
DROP POLICY IF EXISTS "Admins can update vagas" ON vagas;
CREATE POLICY "Admins can update vagas"
  ON vagas FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins podem deletar vagas
DROP POLICY IF EXISTS "Admins can delete vagas" ON vagas;
CREATE POLICY "Admins can delete vagas"
  ON vagas FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================================
-- 2. POSTS (Community Posts)
-- ============================================================================

-- Admins podem ver todos os posts
DROP POLICY IF EXISTS "Admins can view all posts" ON posts;
CREATE POLICY "Admins can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar posts
DROP POLICY IF EXISTS "Admins can manage posts" ON posts;
CREATE POLICY "Admins can manage posts"
  ON posts FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 3. COMMUNITY POSTS
-- ============================================================================

-- Admins podem ver todos os community posts
DROP POLICY IF EXISTS "Admins can view all community posts" ON community_posts;
CREATE POLICY "Admins can view all community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar community posts
DROP POLICY IF EXISTS "Admins can manage community posts" ON community_posts;
CREATE POLICY "Admins can manage community posts"
  ON community_posts FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 4. CLASSIFIEDS (Classified Ads)
-- ============================================================================

-- Admins podem ver todos os classificados
DROP POLICY IF EXISTS "Admins can view all classifieds" ON classifieds;
CREATE POLICY "Admins can view all classifieds"
  ON classifieds FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar classificados
DROP POLICY IF EXISTS "Admins can manage classifieds" ON classifieds;
CREATE POLICY "Admins can manage classifieds"
  ON classifieds FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 5. PROFESSIONAL JOBS
-- ============================================================================

-- Admins podem ver todos os trabalhos profissionais
DROP POLICY IF EXISTS "Admins can view all professional jobs" ON professional_jobs;
CREATE POLICY "Admins can view all professional jobs"
  ON professional_jobs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar trabalhos
DROP POLICY IF EXISTS "Admins can manage professional jobs" ON professional_jobs;
CREATE POLICY "Admins can manage professional jobs"
  ON professional_jobs FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 5. EVENTS
-- ============================================================================

-- Admins podem ver todos os eventos
DROP POLICY IF EXISTS "Admins can view all events" ON events;
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar eventos
DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 6. COMMUNITY ISSUES
-- ============================================================================

-- Admins podem ver todos os problemas da comunidade
DROP POLICY IF EXISTS "Admins can view all community issues" ON community_issues;
CREATE POLICY "Admins can view all community issues"
  ON community_issues FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar problemas
DROP POLICY IF EXISTS "Admins can manage community issues" ON community_issues;
CREATE POLICY "Admins can manage community issues"
  ON community_issues FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 7. RIDE REQUESTS (Mobility)
-- ============================================================================

-- Admins podem ver todas as solicitações de carona
DROP POLICY IF EXISTS "Admins can view all ride requests" ON ride_requests;
CREATE POLICY "Admins can view all ride requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar solicitações
DROP POLICY IF EXISTS "Admins can manage ride requests" ON ride_requests;
CREATE POLICY "Admins can manage ride requests"
  ON ride_requests FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 8. DELIVERY ORDERS
-- ============================================================================

-- Admins podem ver todos os pedidos
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar pedidos
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 9. LOST & FOUND
-- ============================================================================

-- Admins podem ver todos os posts de achados e perdidos
DROP POLICY IF EXISTS "Admins can view all lost found posts" ON lost_found_posts;
CREATE POLICY "Admins can view all lost found posts"
  ON lost_found_posts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar posts
DROP POLICY IF EXISTS "Admins can manage lost found posts" ON lost_found_posts;
CREATE POLICY "Admins can manage lost found posts"
  ON lost_found_posts FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 10. GROUPS
-- ============================================================================

-- Admins podem ver todos os grupos
DROP POLICY IF EXISTS "Admins can view all groups" ON groups;
CREATE POLICY "Admins can view all groups"
  ON groups FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar grupos
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 11. PROFILES
-- ============================================================================

-- Admins podem ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem atualizar perfis (moderação)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 12. LOCATIONS
-- ============================================================================

-- Admins podem ver todas as localizações
DROP POLICY IF EXISTS "Admins can view all locations" ON locations;
CREATE POLICY "Admins can view all locations"
  ON locations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar localizações
DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 13. DELIVERY AREAS & NEIGHBORHOODS (Removido - tabelas não existem)
-- ============================================================================

-- ============================================================================
-- 14. ANALYTICS & LOGS
-- ============================================================================

-- Admins podem ver todos os eventos de analytics
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem ver todos os logs
DROP POLICY IF EXISTS "Admins can view all application logs" ON application_logs;
CREATE POLICY "Admins can view all application logs"
  ON application_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================================
-- 15. SUBSCRIPTIONS & BILLING
-- ============================================================================

-- Admins podem ver todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins podem gerenciar assinaturas
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Admins can view all vagas" ON vagas IS 
'Admins têm acesso total a todas as vagas, independente de localização';

COMMENT ON POLICY "Admins can view all posts" ON posts IS 
'Admins têm acesso total a todos os posts, independente de localização';

COMMENT ON POLICY "Admins can view all events" ON events IS 
'Admins têm acesso total a todos os eventos, independente de localização';

COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 
'Admins podem visualizar todos os perfis para moderação';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Função helper para verificar se usuário é admin
-- (já existe na migration anterior, mas garantindo que está disponível)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    RAISE NOTICE 'Função is_admin não encontrada. Certifique-se de que a migration 20260418000001 foi aplicada.';
  END IF;
END $$;

-- FIM
