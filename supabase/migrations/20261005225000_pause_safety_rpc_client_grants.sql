-- Safety/Mobility are preserved but paused for the current MVP lifecycle.
-- Keep the server-side implementation intact while removing direct PostgREST
-- reachability from browser roles. Re-activation must explicitly re-grant only
-- after the paused module and its public/private contracts are re-certified.

BEGIN;

REVOKE ALL ON FUNCTION public.create_emergency_contact(uuid, text, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_emergency_contact(uuid, text, text, text, text, boolean)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_safety_emergency_alert(uuid, uuid, text, text, double precision, double precision, double precision, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_emergency_alert(uuid, uuid, text, text, double precision, double precision, double precision, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_safety_incident(uuid, uuid, text, text, text, double precision, double precision)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_incident(uuid, uuid, text, text, text, double precision, double precision)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_safety_ride_share(uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_ride_share(uuid, uuid, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.get_shared_ride_safety_data(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_ride_safety_data(text)
  TO service_role;

REVOKE ALL ON FUNCTION public.patch_emergency_contact(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patch_emergency_contact(uuid, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.register_safety_evidence(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_safety_evidence(uuid, text, text, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.revoke_safety_ride_share(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_safety_ride_share(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_safety_emergency_alert_status(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_safety_emergency_alert_status(uuid, text, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_safety_incident_status(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_safety_incident_status(uuid, text, uuid)
  TO service_role;

COMMIT;
