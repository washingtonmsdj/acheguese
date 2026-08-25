-- community_alerts still carried April-era CHECK constraints while the current
-- runtime writes the canonical Portuguese statuses/categories and the
-- territory_centroid coordinate source. Align storage, RLS and admin reads with
-- the current application contract.

-- Development data is legacy-only here. Normalize it before installing the
-- canonical constraints so there is one vocabulary going forward.
UPDATE public.community_alerts
SET status = CASE status
  WHEN 'open' THEN 'ativo'
  WHEN 'active' THEN 'ativo'
  WHEN 'in_progress' THEN 'ativo'
  WHEN 'resolved' THEN 'encerrado'
  WHEN 'closed' THEN 'encerrado'
  WHEN 'ended' THEN 'encerrado'
  WHEN 'expired' THEN 'expirado'
  WHEN 'removed' THEN 'removido'
  WHEN 'deleted' THEN 'removido'
  ELSE status
END
WHERE status IN (
  'open', 'active', 'in_progress', 'resolved', 'closed', 'ended',
  'expired', 'removed', 'deleted'
);

UPDATE public.community_alerts
SET type = CASE type
  WHEN 'security' THEN 'risco_na_via'
  WHEN 'infrastructure' THEN 'risco_na_via'
  WHEN 'health' THEN 'pessoa_vulneravel_em_risco'
  WHEN 'environment' THEN 'alagamento_deslizamento'
  WHEN 'other' THEN 'risco_na_via'
  ELSE type
END
WHERE type IN ('security', 'infrastructure', 'health', 'environment', 'other');

ALTER TABLE public.community_alerts
  DROP CONSTRAINT IF EXISTS community_alerts_status_check,
  DROP CONSTRAINT IF EXISTS community_alerts_type_check,
  DROP CONSTRAINT IF EXISTS community_alerts_coordinate_source_check;

ALTER TABLE public.community_alerts
  ADD CONSTRAINT community_alerts_status_check
  CHECK (status IN ('ativo', 'encerrado', 'expirado', 'removido')),
  ADD CONSTRAINT community_alerts_type_check
  CHECK (type IN (
    'tiroteio_disparos',
    'assalto_em_andamento',
    'tentativa_de_invasao',
    'incendio_explosao',
    'acidente_grave',
    'alagamento_deslizamento',
    'risco_na_via',
    'pessoa_vulneravel_em_risco'
  )),
  ADD CONSTRAINT community_alerts_coordinate_source_check
  CHECK (
    coordinate_source IS NULL
    OR coordinate_source IN ('exact', 'geocoded', 'approximate', 'territory_centroid')
  );

-- Public discovery is only for live, non-removed alerts. Owners keep their own
-- history through the existing ALL policy, while platform admins need explicit
-- full visibility for the moderation console.
DROP POLICY IF EXISTS "Alerts viewable" ON public.community_alerts;
DROP POLICY IF EXISTS "community_alerts_public_active_read" ON public.community_alerts;
DROP POLICY IF EXISTS "community_alerts_platform_admin_read" ON public.community_alerts;

CREATE POLICY "community_alerts_public_active_read"
ON public.community_alerts
FOR SELECT TO anon, authenticated
USING (status = 'ativo' AND removed_at IS NULL);

CREATE POLICY "community_alerts_platform_admin_read"
ON public.community_alerts
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_user((SELECT auth.uid())), FALSE));

DO $verify$
DECLARE
  v_invalid_status integer;
  v_invalid_type integer;
  v_invalid_source integer;
  v_public_broad integer;
BEGIN
  SELECT count(*) INTO v_invalid_status
  FROM public.community_alerts
  WHERE status NOT IN ('ativo', 'encerrado', 'expirado', 'removido');

  SELECT count(*) INTO v_invalid_type
  FROM public.community_alerts
  WHERE type NOT IN (
    'tiroteio_disparos',
    'assalto_em_andamento',
    'tentativa_de_invasao',
    'incendio_explosao',
    'acidente_grave',
    'alagamento_deslizamento',
    'risco_na_via',
    'pessoa_vulneravel_em_risco'
  );

  SELECT count(*) INTO v_invalid_source
  FROM public.community_alerts
  WHERE coordinate_source IS NOT NULL
    AND coordinate_source NOT IN ('exact', 'geocoded', 'approximate', 'territory_centroid');

  SELECT count(*) INTO v_public_broad
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'community_alerts'
    AND p.cmd = 'SELECT'
    AND (p.roles && ARRAY['anon', 'public']::name[])
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_invalid_status <> 0 OR v_invalid_type <> 0 OR v_invalid_source <> 0 THEN
    RAISE EXCEPTION 'community alert canonicalization failed: status=%, type=%, source=%',
      v_invalid_status, v_invalid_type, v_invalid_source;
  END IF;

  IF v_public_broad <> 0 THEN
    RAISE EXCEPTION 'broad public community_alerts SELECT policy remains';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.tablename='community_alerts'
      AND p.policyname='community_alerts_platform_admin_read'
  ) THEN
    RAISE EXCEPTION 'community alert admin read policy missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
