-- G6 Public directory: expose only a sanitized claimability boolean.
-- Keep custody/provenance metadata private. Old businesses without an explicit
-- unclaimed marker remain fail-closed (is_claimable=false).

ALTER TABLE public.public_business_search
  ADD COLUMN IF NOT EXISTS is_claimable boolean NOT NULL DEFAULT false;

UPDATE public.public_business_search pbs
SET is_claimable = COALESCE(
  bd.status = 'active'
  AND (
    bd.metadata->>'custody_status' IN (
      'platform_curated_pending_official_claim',
      'directory_unclaimed',
      'source_backed_unclaimed'
    )
    OR bd.metadata->>'public_record_provenance_status' = 'source_backed_unclaimed'
  ),
  false
)
FROM public.business_data bd
WHERE bd.id = pbs.id;

CREATE OR REPLACE FUNCTION private.sync_public_business_claimability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  UPDATE public.public_business_search
  SET is_claimable = COALESCE(
    NEW.status = 'active'
    AND (
      NEW.metadata->>'custody_status' IN (
        'platform_curated_pending_official_claim',
        'directory_unclaimed',
        'source_backed_unclaimed'
      )
      OR NEW.metadata->>'public_record_provenance_status' = 'source_backed_unclaimed'
    ),
    false
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_public_business_claimability()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_zz_sync_public_business_claimability
ON public.business_data;

CREATE TRIGGER trg_zz_sync_public_business_claimability
AFTER INSERT OR UPDATE OF status, metadata
ON public.business_data
FOR EACH ROW
EXECUTE FUNCTION private.sync_public_business_claimability();

COMMENT ON COLUMN public.public_business_search.is_claimable IS
  'Sanitized public projection: true only while the source-backed directory profile is explicitly unclaimed.';
