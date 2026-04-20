-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: Tabelas principais
-- ============================================================================

-- Tabela de termos bloqueados (consultada pela RPC)
CREATE TABLE IF NOT EXISTS alert_blocked_terms (
  id      serial PRIMARY KEY,
  pattern text NOT NULL,
  active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela principal de alertas
CREATE TABLE IF NOT EXISTS community_alerts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  author_profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category             text NOT NULL CHECK (category IN (
                         'tiroteio_disparos',
                         'assalto_em_andamento',
                         'tentativa_de_invasao',
                         'incendio_explosao',
                         'acidente_grave',
                         'alagamento_deslizamento',
                         'risco_na_via',
                         'pessoa_vulneravel_em_risco'
                       )),
  status               text NOT NULL DEFAULT 'ativo' CHECK (status IN (
                         'ativo',
                         'encerrado',
                         'expirado',
                         'removido'
                       )),
  neighborhood         text NOT NULL,          -- normalizado para filtros/dedup
  neighborhood_display text NOT NULL,          -- label legível para exibição
  city                 text NOT NULL,          -- normalizado
  description          text NOT NULL CHECK (
                         char_length(description) BETWEEN 20 AND 280
                       ),
  seen_personally      boolean NOT NULL,
  started_at_approx    text NOT NULL CHECK (started_at_approx IN (
                         'just_now',
                         'minutes_5',
                         'minutes_15',
                         'minutes_30',
                         'over_30'
                       )),
  is_happening_now     boolean NOT NULL,
  still_risky          boolean NOT NULL,
  expires_at           timestamptz NOT NULL,
  trust_snapshot       jsonb NOT NULL,
  report_count         integer NOT NULL DEFAULT 0,
  under_review         boolean NOT NULL DEFAULT false,
  edit_count           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  ended_at             timestamptz,
  removed_at           timestamptz,
  removal_reason       text,

  -- Consistência lógica: "acontecendo agora" implica "ainda representa risco"
  CONSTRAINT chk_happening_risky CHECK (
    NOT (is_happening_now = true AND still_risky = false)
  ),
  -- Alerta sem valor informativo é bloqueado
  CONSTRAINT chk_min_informative CHECK (
    NOT (seen_personally = false AND is_happening_now = false AND still_risky = false)
  )
);

-- Reports de alertas
CREATE TABLE IF NOT EXISTS community_alert_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    uuid NOT NULL REFERENCES community_alerts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id, reporter_id)  -- 1 report por usuário por alerta
);

-- Audit log imutável
CREATE TABLE IF NOT EXISTS community_alert_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    uuid NOT NULL REFERENCES community_alerts(id) ON DELETE CASCADE,
  actor_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action_type text NOT NULL CHECK (action_type IN (
                 'created',
                 'updated',
                 'ended',
                 'removed',
                 'reported',
                 'expired',
                 'reviewed_cleared'
               )),
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fila de notificações com suporte a retry
CREATE TABLE IF NOT EXISTS alert_notification_queue (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id              uuid NOT NULL REFERENCES community_alerts(id) ON DELETE CASCADE,
  neighborhood          text NOT NULL,
  city                  text NOT NULL,
  processed             boolean NOT NULL DEFAULT false,
  attempt_count         integer NOT NULL DEFAULT 0,
  processing_started_at timestamptz,
  processed_at          timestamptz,
  last_error            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id)  -- 1 entrada por alerta
);
