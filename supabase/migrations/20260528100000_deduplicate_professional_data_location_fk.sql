-- Normalize professional_data -> locations to a single canonical foreign key.
-- Some environments carried both the inline FK name and a duplicate manual FK,
-- which makes PostgREST embeds ambiguous unless every query uses a hint.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.professional_data'::regclass
      AND conname = 'fk_professional_data_location_id'
  ) THEN
    ALTER TABLE public.professional_data
      DROP CONSTRAINT fk_professional_data_location_id;
  END IF;
END $$;
