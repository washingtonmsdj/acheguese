-- Enforce one current tracking row per driver profile.
-- TrackingService writes with onConflict: driver_profile_id, so the database must
-- expose driver_profile_id as a unique key instead of accumulating stale rows.

WITH ranked_locations AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY driver_profile_id
      ORDER BY updated_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.driver_locations
)
DELETE FROM public.driver_locations dl
USING ranked_locations ranked
WHERE dl.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_locations_driver_profile_unique
  ON public.driver_locations(driver_profile_id);

NOTIFY pgrst, 'reload schema';
