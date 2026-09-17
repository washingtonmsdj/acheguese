-- Legacy driver_profiles must follow the same reputation invariant as driver_data:
-- an unrated driver has no rating yet. Never manufacture a perfect 5.0 score.
-- Production currently has no rows in this legacy table, so this is schema-only.

ALTER TABLE public.driver_profiles
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating DROP NOT NULL;
