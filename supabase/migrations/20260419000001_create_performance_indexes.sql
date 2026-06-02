-- =====================================================
-- MIGRATION: Performance Indexes (Simplified)
-- =====================================================
-- Description: Adiciona indexes essenciais para otimizar queries frequentes
-- Author: Kiro AI
-- Date: 2026-04-19
-- Version: 1.0.1 (Simplified - only essential indexes)
-- =====================================================

-- =====================================================
-- NOTIFICATIONS INDEXES
-- =====================================================

-- Index para buscar notificações não lidas por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read)
WHERE read = false;

-- Index para buscar notificações por usuário ordenadas por data
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- =====================================================
-- USER SUBSCRIPTIONS INDEXES (Billing)
-- =====================================================

-- Index para buscar subscriptions por usuário
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user 
ON user_subscriptions(user_id);

-- Index para buscar subscriptions por status
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
ON user_subscriptions(status);

-- Index para buscar subscriptions ativas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active 
ON user_subscriptions(user_id, status) 
WHERE status = 'active';

-- =====================================================
-- USER ROLES INDEXES
-- =====================================================

-- Index para buscar roles por usuário
CREATE INDEX IF NOT EXISTS idx_user_roles_user 
ON user_roles(user_id);

-- Index para buscar roles por tipo
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON user_roles(role);

-- Index composto para verificação rápida de role
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON user_roles(user_id, role);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON INDEX idx_notifications_user_unread IS 'Otimiza busca de notificações não lidas';
COMMENT ON INDEX idx_user_subscriptions_user IS 'Otimiza busca de billing subscriptions por usuário';
COMMENT ON INDEX idx_user_roles_user IS 'Otimiza busca de roles por usuário';

-- =====================================================
-- ANALYZE TABLES
-- =====================================================

-- Atualiza estatísticas do planner para otimizar query plans
ANALYZE notifications;
ANALYZE user_subscriptions;
ANALYZE user_roles;
