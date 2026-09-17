-- New drivers must not start with a fabricated perfect reputation.
-- `driver_data.rating` is nullable; NULL is the canonical unrated state until
-- real completed-ride ratings exist.

ALTER TABLE public.driver_data
  ALTER COLUMN rating DROP DEFAULT;

-- Clean only rows that still satisfy the driver_data ownership invariant.
-- A legacy non-driver row exists in production and is audited separately rather
-- than bypassing the validation trigger or mutating unrelated profile data here.
UPDATE public.driver_data AS dd
SET rating = NULL
FROM public.profiles AS p
WHERE p.id = dd.profile_id
  AND p.profile_type = 'driver'
  AND dd.total_rides = 0
  AND dd.rating = 5.0;
