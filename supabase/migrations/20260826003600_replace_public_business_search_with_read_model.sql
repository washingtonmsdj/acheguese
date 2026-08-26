-- Replace the SECURITY DEFINER public_business_search view with a server-owned,
-- sanitized read-model table. Browser roles can read this table, but cannot
-- mutate it or read the private business_data source table.

DROP VIEW IF EXISTS public.public_business_search RESTRICT;

CREATE TABLE public.public_business_search (
  id uuid PRIMARY KEY REFERENCES public.business_data(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  slug text,
  category text,
  subcategory text,
  description text,
  website text,
  instagram text,
  facebook text,
  opening_hours jsonb,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  latitude numeric,
  longitude numeric,
  status text NOT NULL CHECK (status = 'active'),
  is_premium boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  recommendations_count integer NOT NULL DEFAULT 0,
  business_role text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

ALTER TABLE public.public_business_search ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.public_business_search
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated, service_role;

CREATE POLICY "public_business_search_public_read"
ON public.public_business_search
FOR SELECT TO anon, authenticated
USING (status = 'active');

CREATE INDEX public_business_search_location_idx
  ON public.public_business_search(location_id);
CREATE INDEX public_business_search_category_idx
  ON public.public_business_search(category);
CREATE INDEX public_business_search_role_created_idx
  ON public.public_business_search(business_role, created_at DESC);
CREATE INDEX public_business_search_slug_idx
  ON public.public_business_search(slug);
CREATE INDEX public_business_search_rating_idx
  ON public.public_business_search(rating DESC);

CREATE OR REPLACE FUNCTION private.sync_public_business_search_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_public_metadata jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_business_search WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status <> 'active' THEN
    DELETE FROM public.public_business_search WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  v_public_metadata := jsonb_strip_nulls(jsonb_build_object(
    'logo_url', NEW.metadata->'logo_url',
    'banner_url', NEW.metadata->'banner_url',
    'modos_atendimento', NEW.metadata->'modos_atendimento',
    'tem_delivery', NEW.metadata->'tem_delivery',
    'aceita_cartao', NEW.metadata->'aceita_cartao',
    'aceita_pix', NEW.metadata->'aceita_pix',
    'neighborhood', NEW.metadata->'neighborhood',
    'cep', NEW.metadata->'cep',
    'city', NEW.metadata->'city',
    'state', NEW.metadata->'state'
  ));

  INSERT INTO public.public_business_search (
    id,
    profile_id,
    business_name,
    slug,
    category,
    subcategory,
    description,
    website,
    instagram,
    facebook,
    opening_hours,
    location_id,
    address_id,
    latitude,
    longitude,
    status,
    is_premium,
    is_verified,
    rating,
    total_reviews,
    recommendations_count,
    business_role,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.profile_id,
    NEW.business_name,
    NEW.slug,
    NEW.category,
    NEW.subcategory,
    NEW.description,
    NEW.website,
    NEW.instagram,
    NEW.facebook,
    NEW.opening_hours,
    NEW.location_id,
    NEW.address_id,
    NEW.latitude,
    NEW.longitude,
    NEW.status,
    COALESCE(NEW.is_premium, false),
    COALESCE(NEW.is_verified, false),
    COALESCE(NEW.rating, 0),
    COALESCE(NEW.total_reviews, 0),
    COALESCE(NEW.recommendations_count, 0),
    NEW.business_role,
    v_public_metadata,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    business_name = EXCLUDED.business_name,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    instagram = EXCLUDED.instagram,
    facebook = EXCLUDED.facebook,
    opening_hours = EXCLUDED.opening_hours,
    location_id = EXCLUDED.location_id,
    address_id = EXCLUDED.address_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    is_premium = EXCLUDED.is_premium,
    is_verified = EXCLUDED.is_verified,
    rating = EXCLUDED.rating,
    total_reviews = EXCLUDED.total_reviews,
    recommendations_count = EXCLUDED.recommendations_count,
    business_role = EXCLUDED.business_role,
    metadata = EXCLUDED.metadata,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_public_business_search_row()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_public_business_search
ON public.business_data;
CREATE TRIGGER trg_sync_public_business_search
AFTER INSERT OR UPDATE OR DELETE ON public.business_data
FOR EACH ROW EXECUTE FUNCTION private.sync_public_business_search_row();

INSERT INTO public.public_business_search (
  id,
  profile_id,
  business_name,
  slug,
  category,
  subcategory,
  description,
  website,
  instagram,
  facebook,
  opening_hours,
  location_id,
  address_id,
  latitude,
  longitude,
  status,
  is_premium,
  is_verified,
  rating,
  total_reviews,
  recommendations_count,
  business_role,
  metadata,
  created_at,
  updated_at
)
SELECT
  bd.id,
  bd.profile_id,
  bd.business_name,
  bd.slug,
  bd.category,
  bd.subcategory,
  bd.description,
  bd.website,
  bd.instagram,
  bd.facebook,
  bd.opening_hours,
  bd.location_id,
  bd.address_id,
  bd.latitude,
  bd.longitude,
  bd.status,
  COALESCE(bd.is_premium, false),
  COALESCE(bd.is_verified, false),
  COALESCE(bd.rating, 0),
  COALESCE(bd.total_reviews, 0),
  COALESCE(bd.recommendations_count, 0),
  bd.business_role,
  jsonb_strip_nulls(jsonb_build_object(
    'logo_url', bd.metadata->'logo_url',
    'banner_url', bd.metadata->'banner_url',
    'modos_atendimento', bd.metadata->'modos_atendimento',
    'tem_delivery', bd.metadata->'tem_delivery',
    'aceita_cartao', bd.metadata->'aceita_cartao',
    'aceita_pix', bd.metadata->'aceita_pix',
    'neighborhood', bd.metadata->'neighborhood',
    'cep', bd.metadata->'cep',
    'city', bd.metadata->'city',
    'state', bd.metadata->'state'
  )),
  bd.created_at,
  bd.updated_at
FROM public.business_data bd
WHERE bd.status = 'active';

-- Existing public snapshot functions are intentionally SECURITY INVOKER. Point
-- them at the public read model instead of reopening business_data to browsers.
DO $rewrite$
DECLARE
  v_signature text;
  v_oid oid;
  v_definition text;
  v_rewritten text;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.get_public_business_snapshot_by_slug(text,text,text,text)',
    'public.get_public_gastronomy_snapshot_by_slug(text,text,text,text)'
  ]
  LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'snapshot function missing: %', v_signature;
    END IF;

    SELECT pg_get_functiondef(v_oid) INTO v_definition;
    v_rewritten := replace(
      v_definition,
      'FROM business_data bd',
      'FROM public.public_business_search bd'
    );

    IF v_rewritten = v_definition THEN
      RAISE EXCEPTION 'snapshot function source did not contain expected business_data read: %', v_signature;
    END IF;

    EXECUTE v_rewritten;
  END LOOP;
END
$rewrite$;

DO $verify$
DECLARE
  v_public_count integer;
  v_source_count integer;
  v_private_metadata_rows integer;
  v_bad_grants integer;
  v_bad_snapshot_functions integer;
BEGIN
  SELECT count(*) INTO v_public_count
  FROM public.public_business_search;

  SELECT count(*) INTO v_source_count
  FROM public.business_data
  WHERE status = 'active';

  IF v_public_count <> v_source_count THEN
    RAISE EXCEPTION 'public business read-model count mismatch: public=%, source=%',
      v_public_count, v_source_count;
  END IF;

  SELECT count(*) INTO v_private_metadata_rows
  FROM public.public_business_search
  WHERE metadata ?| ARRAY[
    'source_authority_profile_id',
    'custody_status',
    'coordinate_geocoding_source',
    'coordinate_source',
    'archived_at',
    'source_kind'
  ];

  IF v_private_metadata_rows <> 0 THEN
    RAISE EXCEPTION 'private metadata leaked into public business read model: %',
      v_private_metadata_rows;
  END IF;

  SELECT count(*) INTO v_bad_grants
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(role_name.role_name, 'public.public_business_search', 'INSERT')
     OR has_table_privilege(role_name.role_name, 'public.public_business_search', 'UPDATE')
     OR has_table_privilege(role_name.role_name, 'public.public_business_search', 'DELETE')
     OR has_table_privilege(role_name.role_name, 'public.public_business_search', 'TRUNCATE');

  IF v_bad_grants <> 0 THEN
    RAISE EXCEPTION 'browser DML grants remain on public_business_search';
  END IF;

  SELECT count(*) INTO v_bad_snapshot_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'get_public_business_snapshot_by_slug',
      'get_public_gastronomy_snapshot_by_slug'
    )
    AND (
      p.prosecdef
      OR pg_get_functiondef(p.oid) NOT ILIKE '%FROM public.public_business_search bd%'
      OR pg_get_functiondef(p.oid) ILIKE '%FROM business_data bd%'
    );

  IF v_bad_snapshot_functions <> 0 THEN
    RAISE EXCEPTION 'public snapshot functions are not invoker/read-model backed';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
