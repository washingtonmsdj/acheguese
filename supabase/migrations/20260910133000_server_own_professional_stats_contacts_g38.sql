-- G38: professional_stats is server-owned for lead/contact counters.
-- A lead insertion is the authoritative event; the counter follows in the same
-- database transaction and browser roles no longer have DML on the stats row.

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

DROP TRIGGER IF EXISTS professional_leads_increment_contacts
  ON public.professional_leads;
CREATE TRIGGER professional_leads_increment_contacts
AFTER INSERT
ON public.professional_leads
FOR EACH ROW
EXECUTE FUNCTION private.increment_professional_contacts_from_lead();

-- Reads remain governed by the existing SELECT policies. Only browser DML is
-- retired; service_role/server-owned triggers keep operational authority.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Owners manage own professional stats"
  ON public.professional_stats;
