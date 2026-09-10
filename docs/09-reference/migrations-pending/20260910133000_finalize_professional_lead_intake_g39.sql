-- PENDING CUTOVER — G39 Professional Lead Intake + G38 contact stats authority.
--
-- DO NOT move this file into supabase/migrations until ALL conditions are true:
-- 1. create-professional-lead is deployed and healthy with verify_jwt=false;
-- 2. the production frontend uses ProfessionalLeadIntakeService exclusively;
-- 3. the LIVE production SHA no longer calls ProfessionalLeadService.createLead;
-- 4. anonymous and authenticated quote-request smoke tests pass through the broker.
--
-- Reason: the legacy LIVE frontend increments professional_stats after a direct
-- lead INSERT. Installing the trigger before the new frontend is LIVE would
-- double-count contacts. This cutover removes the browser INSERT authority in
-- the same transaction that makes lead INSERT the authoritative counter event.

BEGIN;

CREATE OR REPLACE FUNCTION private.increment_professional_contacts_from_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.professional_stats (
    profile_id,
    views_count,
    contacts_count,
    favorites_count,
    shares_count,
    jobs_completed,
    response_rate,
    average_response_time
  )
  SELECT
    professional.profile_id,
    0,
    1,
    0,
    0,
    0,
    0,
    0
  FROM public.professional_data AS professional
  WHERE professional.id = NEW.professional_id
  ON CONFLICT (profile_id) DO UPDATE
  SET
    contacts_count = public.professional_stats.contacts_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.increment_professional_contacts_from_lead()
  FROM PUBLIC, anon, authenticated;

-- The public broker is the only quote-request ingress after this point.
GRANT INSERT ON TABLE public.professional_leads TO service_role;

REVOKE INSERT ON TABLE public.professional_leads
  FROM PUBLIC, anon, authenticated;

REVOKE INSERT (
  professional_id,
  requester_user_id,
  requester_profile_id,
  requester_name,
  requester_phone,
  requester_email,
  service_needed,
  description,
  preferred_date,
  preferred_time_window,
  neighborhood,
  location_id,
  source_channel,
  priority,
  metadata
) ON TABLE public.professional_leads
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS professional_leads_public_insert
  ON public.professional_leads;
DROP POLICY IF EXISTS professional_leads_authenticated_insert
  ON public.professional_leads;

DROP TRIGGER IF EXISTS professional_leads_increment_contacts
  ON public.professional_leads;
CREATE TRIGGER professional_leads_increment_contacts
AFTER INSERT
ON public.professional_leads
FOR EACH ROW
EXECUTE FUNCTION private.increment_professional_contacts_from_lead();

-- Reads remain governed by existing SELECT policies. Counter mutations are
-- server-owned only (trigger/service_role) after cutover.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Owners manage own professional stats"
  ON public.professional_stats;

DO $$
DECLARE
  column_name text;
  browser_insert_columns constant text[] := ARRAY[
    'professional_id',
    'requester_user_id',
    'requester_profile_id',
    'requester_name',
    'requester_phone',
    'requester_email',
    'service_needed',
    'description',
    'preferred_date',
    'preferred_time_window',
    'neighborhood',
    'location_id',
    'source_channel',
    'priority',
    'metadata'
  ];
BEGIN
  IF has_table_privilege('anon', 'public.professional_leads', 'INSERT')
     OR has_table_privilege('authenticated', 'public.professional_leads', 'INSERT') THEN
    RAISE EXCEPTION 'G39 cutover failed: browser retains table INSERT on professional_leads';
  END IF;

  FOREACH column_name IN ARRAY browser_insert_columns LOOP
    IF has_column_privilege('anon', 'public.professional_leads', column_name, 'INSERT')
       OR has_column_privilege('authenticated', 'public.professional_leads', column_name, 'INSERT') THEN
      RAISE EXCEPTION 'G39 cutover failed: browser retains INSERT on professional_leads.%', column_name;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('service_role', 'public.professional_leads', 'INSERT') THEN
    RAISE EXCEPTION 'G39 cutover failed: service_role INSERT not preserved';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'professional_leads'
      AND policyname IN (
        'professional_leads_public_insert',
        'professional_leads_authenticated_insert'
      )
  ) THEN
    RAISE EXCEPTION 'G39 cutover failed: legacy browser INSERT policy still exists';
  END IF;

  IF has_table_privilege('anon', 'public.professional_stats', 'INSERT')
     OR has_table_privilege('anon', 'public.professional_stats', 'UPDATE')
     OR has_table_privilege('anon', 'public.professional_stats', 'DELETE')
     OR has_table_privilege('authenticated', 'public.professional_stats', 'INSERT')
     OR has_table_privilege('authenticated', 'public.professional_stats', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.professional_stats', 'DELETE') THEN
    RAISE EXCEPTION 'G38 cutover failed: browser retains professional_stats DML';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'professional_leads_increment_contacts'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'G38 cutover failed: contacts trigger is missing';
  END IF;
END;
$$;

COMMIT;
