-- Ensure the public Complexo community is the SSOT group for its launch neighborhoods.
-- Uses canonical location slugs only; no UUIDs are embedded in the migration.

WITH anchor_city AS (
  SELECT id
  FROM locations
  WHERE type = 'city'
    AND slug = 'salvador'
    AND geographic_path = '/br/ba/salvador'
  LIMIT 1
),
upserted_group AS (
  INSERT INTO territorial_groups (
    slug,
    name,
    description,
    anchor_city_id,
    status,
    metadata
  )
  SELECT
    'complexo-do-nordeste-de-amaralina',
    'Complexo do Nordeste de Amaralina',
    'Agrupamento territorial dos bairros do Complexo do Nordeste de Amaralina em Salvador.',
    anchor_city.id,
    'active',
    jsonb_build_object(
      'is_selector_active', true,
      'public_navigation_enabled', true,
      'community_scope', 'launch'
    )
  FROM anchor_city
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    anchor_city_id = EXCLUDED.anchor_city_id,
    status = 'active',
    metadata = territorial_groups.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING id, anchor_city_id
),
member_locations AS (
  SELECT locations.id
  FROM locations
  JOIN upserted_group ON upserted_group.anchor_city_id = locations.parent_id
  WHERE locations.type IN ('district', 'neighborhood')
    AND locations.status = 'active'
    AND locations.slug IN (
      'nordeste-de-amaralina',
      'santa-cruz',
      'chapada-do-rio-vermelho',
      'vale-das-pedrinhas'
    )
)
INSERT INTO territorial_group_members (group_id, location_id)
SELECT upserted_group.id, member_locations.id
FROM upserted_group
CROSS JOIN member_locations
ON CONFLICT (group_id, location_id) DO NOTHING;

WITH anchor_city AS (
  SELECT id
  FROM locations
  WHERE type = 'city'
    AND slug = 'salvador'
    AND geographic_path = '/br/ba/salvador'
  LIMIT 1
),
target_group AS (
  SELECT territorial_groups.id, territorial_groups.anchor_city_id
  FROM territorial_groups
  JOIN anchor_city ON anchor_city.id = territorial_groups.anchor_city_id
  WHERE territorial_groups.slug = 'complexo-do-nordeste-de-amaralina'
  LIMIT 1
)
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
  target_group.anchor_city_id,
  'territorial_group',
  target_group.id,
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
FROM target_group
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
