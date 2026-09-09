-- G35A2: enforce one professional_data extension per Profile.
-- Reconcile existing duplicate extensions without hardcoded generated IDs.

CREATE TEMP TABLE tmp_professional_dedupe (
  duplicate_id uuid PRIMARY KEY,
  canonical_id uuid NOT NULL,
  profile_id uuid NOT NULL
) ON COMMIT DROP;

WITH ranked AS (
  SELECT
    professional.id,
    professional.profile_id,
    row_number() OVER (
      PARTITION BY professional.profile_id
      ORDER BY
        (
          lower(btrim(COALESCE(professional.professional_name, ''))) =
          lower(btrim(COALESCE(profile.name, '')))
        ) DESC,
        EXISTS (
          SELECT 1
          FROM private.professional_credentials AS credential
          WHERE credential.professional_id = professional.id
        ) DESC,
        professional.created_at ASC,
        professional.id ASC
    ) AS rank
  FROM public.professional_data AS professional
  JOIN public.profiles AS profile
    ON profile.id = professional.profile_id
  WHERE professional.profile_id IN (
    SELECT duplicate.profile_id
    FROM public.professional_data AS duplicate
    GROUP BY duplicate.profile_id
    HAVING count(*) > 1
  )
),
canonical AS (
  SELECT profile_id, id AS canonical_id
  FROM ranked
  WHERE rank = 1
)
INSERT INTO tmp_professional_dedupe (duplicate_id, canonical_id, profile_id)
SELECT ranked.id, canonical.canonical_id, ranked.profile_id
FROM ranked
JOIN canonical USING (profile_id)
WHERE ranked.rank > 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN private.professional_credentials AS credential
      ON credential.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.professional_leads AS lead
      ON lead.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.professional_profile_media AS media
      ON media.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.professional_service_engagements AS engagement
      ON engagement.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.professional_slug_history AS history
      ON history.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.work_opportunities AS opportunity
      ON opportunity.professional_id = mapping.duplicate_id
  ) OR EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN public.service_areas AS coverage
      ON coverage.entity_type = 'service_provider'
     AND coverage.entity_id = mapping.duplicate_id
  ) THEN
    RAISE EXCEPTION 'professional_duplicate_has_operational_references';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_professional_dedupe AS mapping
    JOIN private.entity_contact_channels AS duplicate_contact
      ON duplicate_contact.professional_id = mapping.duplicate_id
    JOIN private.entity_contact_channels AS canonical_contact
      ON canonical_contact.professional_id = mapping.canonical_id
     AND canonical_contact.channel_type = duplicate_contact.channel_type
  ) THEN
    RAISE EXCEPTION 'professional_duplicate_contact_conflict';
  END IF;
END;
$$;

UPDATE private.entity_contact_channels AS contact
SET professional_id = mapping.canonical_id,
    updated_at = now()
FROM tmp_professional_dedupe AS mapping
WHERE contact.professional_id = mapping.duplicate_id;

DELETE FROM public.professional_data AS professional
USING tmp_professional_dedupe AS mapping
WHERE professional.id = mapping.duplicate_id;

CREATE UNIQUE INDEX IF NOT EXISTS professional_data_profile_id_uidx
  ON public.professional_data (profile_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.professional_data'::regclass
      AND conname = 'professional_data_profile_id_key'
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.professional_data
      ADD CONSTRAINT professional_data_profile_id_key
      UNIQUE USING INDEX professional_data_profile_id_uidx;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    GROUP BY profile_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'professional_profile_extension_uniqueness_not_reconciled';
  END IF;
END;
$$;

COMMENT ON CONSTRAINT professional_data_profile_id_key
  ON public.professional_data
  IS 'Exactly one professional_data extension is allowed per Profile.';
