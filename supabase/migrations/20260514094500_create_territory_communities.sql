-- Comunidades territoriais: camada de experiencia comunitaria sobre cidade publica.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'community_status'
  ) THEN
    CREATE TYPE community_status AS ENUM (
      'active',
      'launching',
      'waiting_list',
      'coming_soon',
      'inactive'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS territory_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  city_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  territory_type TEXT NOT NULL CHECK (territory_type IN ('district', 'territorial_group')),
  territory_id UUID NOT NULL,
  status community_status NOT NULL DEFAULT 'coming_soon',
  headline TEXT,
  description TEXT,
  launch_message TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  primary_cta_label TEXT,
  secondary_cta_label TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT territory_communities_slug_city_unique UNIQUE (slug, city_id)
);

CREATE INDEX IF NOT EXISTS idx_territory_communities_city_status
  ON territory_communities (city_id, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_territory_communities_territory
  ON territory_communities (territory_type, territory_id);

DROP TRIGGER IF EXISTS update_territory_communities_updated_at ON territory_communities;

CREATE TRIGGER update_territory_communities_updated_at
  BEFORE UPDATE ON territory_communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE territory_communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "territory_communities_public_select" ON territory_communities;

CREATE POLICY "territory_communities_public_select"
  ON territory_communities FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON territory_communities TO anon, authenticated;

-- Seed canonica inicial: Complexo (ativo) e Pituba (coming_soon).
INSERT INTO territory_communities (
  name,
  slug,
  city_id,
  territory_type,
  territory_id,
  status,
  headline,
  description,
  launch_message,
  hero_title,
  hero_subtitle,
  primary_cta_label,
  secondary_cta_label,
  is_featured,
  sort_order
)
SELECT
  'Achegue-se Complexo',
  'complexo-do-nordeste-de-amaralina',
  c.id,
  'territorial_group',
  g.id,
  'active',
  'A comunidade digital do Complexo',
  'Moradores, comercios, servicos, alertas, eventos e oportunidades do Complexo em um so lugar.',
  NULL,
  'Achegue-se Complexo',
  'O que esta acontecendo no Complexo hoje?',
  'Entrar na comunidade',
  'Comercios do Complexo',
  true,
  1
FROM locations c
JOIN territorial_groups g ON g.anchor_city_id = c.id AND g.slug = 'complexo-do-nordeste-de-amaralina'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE
SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = EXCLUDED.status,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
INSERT INTO territory_communities (
  name,
  slug,
  city_id,
  territory_type,
  territory_id,
  status,
  headline,
  description,
  launch_message,
  hero_title,
  hero_subtitle,
  primary_cta_label,
  secondary_cta_label,
  is_featured,
  sort_order
)
SELECT
  'Achegue-se Pituba',
  'pituba',
  c.id,
  'district',
  d.id,
  'coming_soon',
  'Achegue-se Pituba esta chegando',
  'Em breve, uma comunidade digital para moradores, comercios, servicos e oportunidades da Pituba.',
  'Cadastre seu interesse para ser avisado e indique comercios da regiao.',
  'A comunidade da Pituba esta chegando',
  'Cadastre seu interesse para ser avisado.',
  'Cadastrar interesse',
  'Quero minha empresa na Pituba',
  true,
  2
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'pituba'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE
SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = EXCLUDED.status,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
