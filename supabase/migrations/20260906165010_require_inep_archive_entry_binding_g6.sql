ALTER TABLE private.education_public_import_batches
  DROP CONSTRAINT IF EXISTS education_public_import_batches_archive_binding_chk;

ALTER TABLE private.education_public_import_batches
  ADD CONSTRAINT education_public_import_batches_archive_binding_chk
  CHECK (
    manifest#>>'{safety,archive_binding_verified}' = 'true'
    AND lower(COALESCE(manifest#>>'{source,archive_entry_sha256}', ''))
      ~ '^[0-9a-f]{64}$'
    AND lower(COALESCE(manifest#>>'{source,extracted_file_sha256}', ''))
      ~ '^[0-9a-f]{64}$'
    AND lower(manifest#>>'{source,archive_entry_sha256}')
      = lower(manifest#>>'{source,extracted_file_sha256}')
    AND char_length(COALESCE(manifest#>>'{source,archive_entry}', ''))
      BETWEEN 1 AND 1000
    AND regexp_replace(
      COALESCE(manifest#>>'{source,archive_entry}', ''),
      '^.*/',
      ''
    ) = source_file_name
  );

COMMENT ON CONSTRAINT education_public_import_batches_archive_binding_chk
ON private.education_public_import_batches IS
  'Requires a verified cryptographic binding between the staged extracted CSV and the matching entry inside the declared INEP ZIP archive.';
