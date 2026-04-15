-- ============================================================================
-- Community Issues — Tabelas principais
-- ============================================================================

-- Enum de categoria
CREATE TYPE issue_category AS ENUM (
  'buraco_via',
  'calcada_danificada',
  'iluminacao_publica',
  'lixo_acumulado',
  'alagamento_cronico',
  'arvore_risco',
  'sinalizacao_danificada',
  'esgoto_aberto',
  'pichacao_vandalismo',
  'outro'
);

-- Enum de status operacional (workflow)
-- Moderação é tratada em campos separados (under_review, removed_at)
CREATE TYPE issue_status AS ENUM (
  'aberto',
  'em_analise',
  'em_andamento',
  'resolvido',
  'rejeitado'
);

-- Enum de prioridade
CREATE TYPE issue_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Enum de motivo de report
CREATE TYPE issue_report_reason AS ENUM (
  'duplicate',
  'false_report',
  'inappropriate_content',
  'spam',
  'other'
);

-- Enum de ação de audit
CREATE TYPE issue_audit_action AS ENUM (
  'created',
  'updated',
  'status_changed',
  'supported',
  'reported',
  'reviewed_cleared',
  'removed'
);

-- ============================================================================
-- TABELA PRINCIPAL
-- ============================================================================

CREATE TABLE community_issues (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category             issue_category NOT NULL,
  status               issue_status NOT NULL DEFAULT 'aberto',
  priority             issue_priority NOT NULL DEFAULT 'media',
  title                TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 100),
  description          TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 500),
  images               TEXT[] DEFAULT '{}',
  neighborhood         TEXT NOT NULL,           -- normalizado para filtros
  neighborhood_display TEXT NOT NULL,           -- label legível
  city                 TEXT NOT NULL,
  address_reference    TEXT CHECK (char_length(address_reference) <= 150),
  support_count        INTEGER NOT NULL DEFAULT 0,
  comments_count       INTEGER NOT NULL DEFAULT 0,
  report_count         INTEGER NOT NULL DEFAULT 0,
  -- Moderação (separada do workflow operacional)
  under_review         BOOLEAN NOT NULL DEFAULT FALSE,
  removed_at           TIMESTAMPTZ,
  removal_reason       TEXT,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUPORTE (upvote)
-- ============================================================================

CREATE TABLE community_issue_supports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issue_id, profile_id)
);

-- ============================================================================
-- REPORTS (denúncias de abuso)
-- ============================================================================

CREATE TABLE community_issue_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id            UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason              issue_report_reason NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issue_id, reporter_profile_id)
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE community_issue_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  action_type issue_audit_action NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
