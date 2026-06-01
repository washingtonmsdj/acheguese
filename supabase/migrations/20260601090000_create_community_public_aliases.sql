-- Alias publico curto para comunidades: /:alias
-- A URL territorial completa continua disponivel como fallback deterministico:
-- /comunidade/:state/:city/:communitySlug

CREATE TABLE IF NOT EXISTS community_public_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  territory_community_id UUID NOT NULL REFERENCES territory_communities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_public_aliases_alias_format
    CHECK (alias ~ '^[a-z0-9-]+$'),
  CONSTRAINT community_public_aliases_alias_not_reserved
    CHECK (
      alias !~ '^[a-z]{2}$'
      AND alias <> ALL (ARRAY[
        'admin',
        'ai',
        'analytics',
        'br',
        'brasil',
        'busca',
        'buscar',
        'cadastro',
        'central',
        'chat',
        'checkout',
        'classificados',
        'comunicacao',
        'comunidade',
        'conta',
        'contato',
        'cupons',
        'dpo',
        'educacao',
        'empresas',
        'eventos',
        'gastronomia',
        'gastronomia-premium',
        'login',
        'mapa',
        'mensagens',
        'mobilidade',
        'notificacoes',
        'notifications',
        'oportunidades',
        'onboarding',
        'p',
        'perto-de-mim',
        'planos',
        'privacidade',
        'q',
        'ranking',
        'recomendacoes',
        'regras',
        'reset-password',
        'servicos',
        'settings',
        'sobre',
        'splash',
        'status',
        'termos',
        'track',
        'u',
        'vagas'
      ])
    ),
  CONSTRAINT community_public_aliases_alias_unique UNIQUE (alias),
  CONSTRAINT community_public_aliases_community_alias_unique
    UNIQUE (territory_community_id, alias)
);

CREATE INDEX IF NOT EXISTS idx_community_public_aliases_community
  ON community_public_aliases (territory_community_id);

CREATE INDEX IF NOT EXISTS idx_community_public_aliases_status
  ON community_public_aliases (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_public_aliases_active_community_unique
  ON community_public_aliases (territory_community_id)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS update_community_public_aliases_updated_at ON community_public_aliases;
CREATE TRIGGER update_community_public_aliases_updated_at
  BEFORE UPDATE ON community_public_aliases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE community_public_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_public_aliases_public_select" ON community_public_aliases;
CREATE POLICY "community_public_aliases_public_select"
  ON community_public_aliases FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

GRANT SELECT ON community_public_aliases TO anon, authenticated;

-- Backfill seguro: so cria alias curto para slugs nao ambiguos no pais.
WITH unique_community_slugs AS (
  SELECT slug, MIN(id) AS territory_community_id
  FROM territory_communities
  WHERE status <> 'inactive'
    AND slug !~ '^[a-z]{2}$'
    AND slug <> ALL (ARRAY[
      'admin',
      'ai',
      'analytics',
      'br',
      'brasil',
      'busca',
      'buscar',
      'cadastro',
      'central',
      'chat',
      'checkout',
      'classificados',
      'comunicacao',
      'comunidade',
      'conta',
      'contato',
      'cupons',
      'dpo',
      'educacao',
      'empresas',
      'eventos',
      'gastronomia',
      'gastronomia-premium',
      'login',
      'mapa',
      'mensagens',
      'mobilidade',
      'notificacoes',
      'notifications',
      'oportunidades',
      'onboarding',
      'p',
      'perto-de-mim',
      'planos',
      'privacidade',
      'q',
      'ranking',
      'recomendacoes',
      'regras',
      'reset-password',
      'servicos',
      'settings',
      'sobre',
      'splash',
      'status',
      'termos',
      'track',
      'u',
      'vagas'
    ])
  GROUP BY slug
  HAVING COUNT(*) = 1
)
INSERT INTO community_public_aliases (alias, territory_community_id, status)
SELECT slug, territory_community_id, 'active'
FROM unique_community_slugs
ON CONFLICT (alias) DO NOTHING;

COMMENT ON TABLE community_public_aliases IS
  'Aliases publicos globais para URLs curtas de comunidades em /:alias.';

COMMENT ON COLUMN community_public_aliases.alias IS
  'Slug global e unico usado na URL curta publica da comunidade.';
