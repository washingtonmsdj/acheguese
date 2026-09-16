-- New drivers must not start with a fabricated perfect reputation.
-- `driver_data.rating` is nullable; NULL is the canonical unrated state until
-- real completed-ride ratings exist.

ALTER TABLE public.driver_data
  ALTER COLUMN rating DROP DEFAULT;

UPDATE public.driver_data
SET rating = NULL
WHERE total_rides = 0
  AND rating = 5.0;
