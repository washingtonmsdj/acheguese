-- Harden address ownership without breaking trusted/system-created address rows.
-- Authenticated browser inserts that omit owner_user_id are claimed by auth.uid()
-- before RLS WITH CHECK runs. Service-role/system inserts keep NULL ownership because
-- auth.uid() is NULL in that context and service_role bypasses RLS.
-- Existing orphan rows are intentionally preserved; this migration only closes
-- the legacy UPDATE/DELETE capability that allowed any authenticated user to
-- mutate rows where owner_user_id IS NULL.

BEGIN;

CREATE OR REPLACE FUNCTION private.assign_authenticated_address_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF NEW.owner_user_id IS NULL AND v_user_id IS NOT NULL THEN
    NEW.owner_user_id := v_user_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.assign_authenticated_address_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.assign_authenticated_address_owner() FROM anon;
REVOKE ALL ON FUNCTION private.assign_authenticated_address_owner() FROM authenticated;

DROP TRIGGER IF EXISTS assign_authenticated_address_owner ON public.addresses;
CREATE TRIGGER assign_authenticated_address_owner
BEFORE INSERT ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION private.assign_authenticated_address_owner();

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

COMMIT;
