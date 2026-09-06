ALTER TABLE private.education_public_import_batches
  DROP CONSTRAINT IF EXISTS education_public_import_batches_normalized_output_chk;

ALTER TABLE private.education_public_import_batches
  ADD CONSTRAINT education_public_import_batches_normalized_output_chk
  CHECK (
    COALESCE(manifest#>>'{normalized_output,contract}', '')
      = 'acheguese.public-education-inep-jsonl/1'
    AND lower(COALESCE(manifest#>>'{normalized_output,sha256}', ''))
      ~ '^[0-9a-f]{64}$'
    AND COALESCE(manifest#>>'{normalized_output,file}', '')
      ~ '^[^/\\]{1,255}$'
    AND COALESCE(manifest#>>'{normalized_output,rows}', '')
      = COALESCE(manifest#>>'{counts,target_municipality_rows}', '')
    AND COALESCE(
      manifest#>>'{normalized_output,raw_record_hash_contract}',
      ''
    ) = 'acheguese.inep-raw-record-sha256/1'
  );

COMMENT ON CONSTRAINT education_public_import_batches_normalized_output_chk
ON private.education_public_import_batches IS
  'Binds every INEP batch to one normalized JSONL artifact contract, basename, SHA-256, row count and raw-record hash contract.';
