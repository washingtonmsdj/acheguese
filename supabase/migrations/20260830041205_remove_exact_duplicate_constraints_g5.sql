-- G5: remove exact duplicate constraints while preserving the versioned canonical copies.
-- No application rows are mutated.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_location_id;

ALTER TABLE public.ride_ratings
  DROP CONSTRAINT IF EXISTS ride_ratings_rating_check;

ALTER TABLE public.safety_evidence
  DROP CONSTRAINT IF EXISTS safety_evidence_evidence_type_check;

ALTER TABLE public.safety_incidents
  DROP CONSTRAINT IF EXISTS safety_incidents_incident_type_check;
