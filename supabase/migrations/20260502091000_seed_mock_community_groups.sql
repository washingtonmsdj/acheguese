-- Mock community groups for the Complexo launch experience.

WITH target_location AS (
  SELECT id
  FROM locations
  WHERE slug IN ('nordeste-de-amaralina', 'nordeste')
  ORDER BY CASE WHEN slug = 'nordeste-de-amaralina' THEN 0 ELSE 1 END
  LIMIT 1
),
first_profile AS (
  SELECT id
  FROM profiles
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1
),
upserted AS (
  INSERT INTO groups (
    name,
    description,
    avatar_url,
    type,
    status,
    created_by,
    location_id,
    category,
    is_private,
    visibility,
    join_policy,
    posting_policy,
    member_visibility,
    media_policy,
    rules,
    capabilities,
    tags
  )
  VALUES
    (
      'Avisos do Complexo',
      'Comunicados importantes, alertas preventivos e informacoes rapidas para moradores do Complexo.',
      NULL,
      'community',
      'active',
      (SELECT id FROM first_profile),
      (SELECT id FROM target_location),
      'avisos',
      false,
      'public',
      'open',
      'admins',
      'members_count_public',
      'manual_download',
      'Respeite moradores, comerciantes e liderancas locais.' || E'\n' ||
      'Evite boatos: publique alertas com contexto verificavel.' || E'\n' ||
      'Somente administradores publicam comunicados oficiais.',
      '{"text": true, "images": true, "audio": true, "polls": true, "chat": true, "reactions": true, "reports": true, "share_link": true}'::jsonb,
      ARRAY['complexo', 'avisos', 'seguranca']
    ),
    (
      'Empreendedores e Servicos Locais',
      'Espaco para comerciantes, profissionais, prestadores e moradores trocarem indicacoes, oportunidades e pedidos.',
      NULL,
      'interest',
      'active',
      (SELECT id FROM first_profile),
      (SELECT id FROM target_location),
      'comercio',
      false,
      'public',
      'open',
      'members',
      'members_count_public',
      'manual_download',
      'Publique ofertas com clareza e sem spam.' || E'\n' ||
      'Negociacoes sao responsabilidade das partes.' || E'\n' ||
      'Denuncie golpes, propaganda abusiva ou perfis falsos.',
      '{"text": true, "images": true, "audio": true, "polls": true, "chat": true, "reactions": true, "reports": true, "share_link": true}'::jsonb,
      ARRAY['complexo', 'comercio', 'servicos']
    )
  ON CONFLICT DO NOTHING
  RETURNING id, created_by
)
INSERT INTO group_members_new (group_id, member_profile_id, role)
SELECT id, created_by, 'admin'
FROM upserted
WHERE created_by IS NOT NULL
ON CONFLICT DO NOTHING;
