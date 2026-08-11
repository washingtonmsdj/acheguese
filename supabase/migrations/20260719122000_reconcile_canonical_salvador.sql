-- Reconcile the archived Fase 2 Salvador fixture with the canonical IBGE city.
--
-- This migration is intentionally fail-closed. It accepts only the audited
-- pre-state or its own post-state, preserves every UUID, and never guesses a
-- city from a non-unique slug.

DO $$
DECLARE
  v_canonical_city_id CONSTANT uuid := '63c41c29-adce-40f5-a552-e52d176123c3';
  v_canonical_state_id CONSTANT uuid := '35448ab5-6028-47a8-85d3-af2d212d1cb4';
  v_canonical_country_id CONSTANT uuid := '69d56449-0d83-468f-8f65-7339bb1c2ea2';
  v_legacy_city_id CONSTANT uuid := '00000000-0000-0000-0000-000000000001';
  v_legacy_state_id CONSTANT uuid := '00000000-0000-0000-0000-000000000010';
  v_legacy_country_id CONSTANT uuid := '00000000-0000-0000-0000-000000000000';
  v_legacy_barra_id CONSTANT uuid := '00000000-0000-0000-0000-000000000002';
  v_legacy_pelourinho_id CONSTANT uuid := '00000000-0000-0000-0000-000000000003';
  v_canonical_barra_id CONSTANT uuid := '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3';
  v_canonical_pelourinho_id CONSTANT uuid := '40000000-0000-0000-0000-000000000003';
  v_legacy_ids CONSTANT uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid
  ];
  v_already_archived boolean;
  v_count bigint;
  v_fk record;
BEGIN
  SELECT count(*)
    INTO v_count
  FROM public.locations city
  JOIN public.locations state ON state.id = city.parent_id
  JOIN public.locations country ON country.id = state.parent_id
  WHERE city.id = v_canonical_city_id
    AND city.type = 'city'
    AND city.slug = 'salvador'
    AND city.geographic_path = '/br/ba/salvador'
    AND city.status = 'active'
    AND city.metadata->>'ibge_code' = '2927408'
    AND state.id = v_canonical_state_id
    AND state.type = 'state'
    AND state.slug = 'ba'
    AND state.geographic_path = '/br/ba'
    AND country.id = v_canonical_country_id
    AND country.type = 'country'
    AND country.slug = 'br'
    AND country.geographic_path = '/br';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'salvador_reconciliation: canonical IBGE hierarchy does not match the audited state';
  END IF;

  SELECT city.slug = 'salvador-legacy-fase2'
    INTO v_already_archived
  FROM public.locations city
  JOIN public.locations state ON state.id = city.parent_id
  JOIN public.locations country ON country.id = state.parent_id
  WHERE city.id = v_legacy_city_id
    AND city.type = 'city'
    AND city.slug IN ('salvador', 'salvador-legacy-fase2')
    AND city.geographic_path IN (
      '/brasil/bahia/salvador',
      '/brasil/bahia/salvador-legacy-fase2'
    )
    AND city.status = 'inactive'
    AND state.id = v_legacy_state_id
    AND state.type = 'state'
    AND state.slug = 'bahia'
    AND state.geographic_path = '/brasil/bahia'
    AND country.id = v_legacy_country_id
    AND country.type = 'country'
    AND country.slug = 'brasil'
    AND country.geographic_path = '/brasil';

  IF v_already_archived IS NULL THEN
    RAISE EXCEPTION 'salvador_reconciliation: legacy Fase 2 hierarchy does not match the audited state';
  END IF;

  SELECT count(*)
    INTO v_count
  FROM public.locations
  WHERE parent_id = v_legacy_city_id;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'salvador_reconciliation: legacy Salvador has % children; expected exactly Barra and Pelourinho', v_count;
  END IF;

  SELECT count(*)
    INTO v_count
  FROM public.locations child
  WHERE (
      (child.id = v_legacy_barra_id AND child.slug IN ('barra', 'barra-legacy-fase2'))
      OR
      (child.id = v_legacy_pelourinho_id AND child.slug IN ('pelourinho', 'pelourinho-legacy-fase2'))
    )
    AND child.parent_id = v_legacy_city_id
    AND child.type = 'district'
    AND child.status = 'inactive'
    AND child.geographic_path IN (
      '/brasil/bahia/salvador/barra',
      '/brasil/bahia/salvador/pelourinho',
      '/brasil/bahia/salvador-legacy-fase2/barra-legacy-fase2',
      '/brasil/bahia/salvador-legacy-fase2/pelourinho-legacy-fase2'
    );

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'salvador_reconciliation: legacy children differ from the audited Barra/Pelourinho fixtures';
  END IF;

  SELECT count(*)
    INTO v_count
  FROM public.locations canonical_child
  WHERE (canonical_child.id, canonical_child.slug) IN (
      (v_canonical_barra_id, 'barra'),
      (v_canonical_pelourinho_id, 'pelourinho')
    )
    AND canonical_child.parent_id = v_canonical_city_id
    AND canonical_child.type = 'neighborhood'
    AND canonical_child.geographic_path IN (
      '/br/ba/salvador/barra',
      '/br/ba/salvador/pelourinho'
    );

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'salvador_reconciliation: canonical Barra/Pelourinho equivalents do not match the audited state';
  END IF;

  -- Every declared FK to locations is checked dynamically. The only expected
  -- reference is locations.parent_id for the two archived fixture children.
  FOR v_fk IN
    SELECT DISTINCT
      source_namespace.nspname AS source_schema,
      source_table.relname AS source_table,
      source_column.attname AS source_column
    FROM pg_catalog.pg_constraint constraint_definition
    JOIN pg_catalog.pg_class source_table
      ON source_table.oid = constraint_definition.conrelid
    JOIN pg_catalog.pg_namespace source_namespace
      ON source_namespace.oid = source_table.relnamespace
    JOIN pg_catalog.pg_class target_table
      ON target_table.oid = constraint_definition.confrelid
    JOIN pg_catalog.pg_namespace target_namespace
      ON target_namespace.oid = target_table.relnamespace
    JOIN LATERAL unnest(constraint_definition.conkey) AS source_key(attnum)
      ON true
    JOIN pg_catalog.pg_attribute source_column
      ON source_column.attrelid = source_table.oid
     AND source_column.attnum = source_key.attnum
    WHERE constraint_definition.contype = 'f'
      AND target_namespace.nspname = 'public'
      AND target_table.relname = 'locations'
      AND NOT (
        source_namespace.nspname = 'public'
        AND source_table.relname = 'locations'
        AND source_column.attname = 'parent_id'
      )
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM %I.%I WHERE %I = ANY ($1)',
      v_fk.source_schema,
      v_fk.source_table,
      v_fk.source_column
    )
      INTO v_count
      USING v_legacy_ids;

    IF v_count > 0 THEN
      RAISE EXCEPTION
        'salvador_reconciliation: unexpected reference %.%(%) has % legacy rows',
        v_fk.source_schema,
        v_fk.source_table,
        v_fk.source_column,
        v_count;
    END IF;
  END LOOP;

  -- Known territorial UUID references that are intentionally not backed by a
  -- locations FK are checked explicitly as well.
  SELECT
    (SELECT count(*) FROM public.businesses WHERE location_id = ANY (v_legacy_ids))
    + (SELECT count(*) FROM public.territory_communities WHERE territory_id = ANY (v_legacy_ids))
    + (SELECT count(*) FROM public.community_entity_links
       WHERE entity_type = 'location' AND entity_id = ANY (v_legacy_ids))
    INTO v_count;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'salvador_reconciliation: unexpected non-FK territorial references found for legacy fixtures';
  END IF;

  UPDATE public.locations
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'canonical_identity', 'ibge:2927408',
        'canonical_status', 'confirmed',
        'canonicalized_by', '20260719122000_reconcile_canonical_salvador'
      ),
      updated_at = now()
  WHERE id = v_canonical_city_id;

  UPDATE public.locations
  SET slug = 'salvador-legacy-fase2',
      geographic_path = '/brasil/bahia/salvador-legacy-fase2',
      status = 'inactive',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'canonical_location_id', v_canonical_city_id,
        'archive_reason', 'superseded_fase2_fixture',
        'archived_by', '20260719122000_reconcile_canonical_salvador'
      ),
      updated_at = now()
  WHERE id = v_legacy_city_id;

  UPDATE public.locations
  SET slug = CASE id
        WHEN v_legacy_barra_id THEN 'barra-legacy-fase2'
        WHEN v_legacy_pelourinho_id THEN 'pelourinho-legacy-fase2'
      END,
      geographic_path = CASE id
        WHEN v_legacy_barra_id THEN '/brasil/bahia/salvador-legacy-fase2/barra-legacy-fase2'
        WHEN v_legacy_pelourinho_id THEN '/brasil/bahia/salvador-legacy-fase2/pelourinho-legacy-fase2'
      END,
      status = 'inactive',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'canonical_location_id', CASE id
          WHEN v_legacy_barra_id THEN v_canonical_barra_id
          WHEN v_legacy_pelourinho_id THEN v_canonical_pelourinho_id
        END,
        'archive_reason', 'superseded_fase2_fixture',
        'archived_by', '20260719122000_reconcile_canonical_salvador'
      ),
      updated_at = now()
  WHERE id = ANY (ARRAY[v_legacy_barra_id, v_legacy_pelourinho_id]);

  SELECT count(*)
    INTO v_count
  FROM public.locations
  WHERE type = 'city'
    AND slug = 'salvador';

  IF v_count <> 1 OR NOT EXISTS (
    SELECT 1
    FROM public.locations
    WHERE id = v_canonical_city_id
      AND type = 'city'
      AND slug = 'salvador'
      AND geographic_path = '/br/ba/salvador'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'salvador_reconciliation: postcondition did not establish one canonical Salvador';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.locations
    WHERE parent_id = v_legacy_city_id
      AND slug IN ('barra', 'pelourinho')
  ) THEN
    RAISE EXCEPTION 'salvador_reconciliation: archived fixture slugs still split canonical neighborhoods';
  END IF;
END $$;

-- Government identity is the only safe global city uniqueness key. City slugs
-- are not globally unique, while IBGE municipality codes are.
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_city_ibge_code_unique
  ON public.locations ((metadata->>'ibge_code'))
  WHERE type = 'city'
    AND nullif(metadata->>'ibge_code', '') IS NOT NULL;
