-- Production drift reconciliation.
-- The canonical profile creation contract already retired this browser-facing
-- admin bootstrap. Keep DROP non-cascading so unexpected dependencies fail closed.

DROP FUNCTION IF EXISTS public.ensure_admin_driver_data(uuid);
