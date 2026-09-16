-- Achegue-se now exposes public self-service signup. The historical private-alpha
-- admission trigger must no longer block auth.users inserts with invite-only rules.
-- Keep the private alpha tables/functions only as historical audit compatibility;
-- they are not part of the current signup authority.

BEGIN;

DROP TRIGGER IF EXISTS enforce_private_alpha_access_trigger ON auth.users;

UPDATE private.alpha_access_control
SET admissions_enabled = TRUE,
    updated_at = now(),
    updated_by_user_id = NULL
WHERE singleton = TRUE;

COMMENT ON FUNCTION private.enforce_private_alpha_access() IS
  'Retained only for historical private-alpha audit compatibility; no longer attached to auth.users because Achegue-se signup is public.';

COMMIT;
