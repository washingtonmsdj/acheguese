ALTER TABLE private.education_public_import_batches
  DROP CONSTRAINT IF EXISTS education_public_import_batches_landing_updated_at_chk;

ALTER TABLE private.education_public_import_batches
  ADD CONSTRAINT education_public_import_batches_landing_updated_at_chk
  CHECK (
    (
      source_page_updated_at IS NULL
      AND NULLIF(
        btrim(COALESCE(manifest#>>'{source,landing_page_updated_at}', '')),
        ''
      ) IS NULL
    )
    OR (
      source_page_updated_at IS NOT NULL
      AND NULLIF(
        btrim(COALESCE(manifest#>>'{source,landing_page_updated_at}', '')),
        ''
      ) IS NOT NULL
      AND (
        manifest#>>'{source,landing_page_updated_at}'
      )::timestamptz = source_page_updated_at
    )
  );

COMMENT ON CONSTRAINT education_public_import_batches_landing_updated_at_chk
ON private.education_public_import_batches IS
  'Keeps the batch source_page_updated_at column identical to the landing_page_updated_at provenance recorded in the import manifest.';
