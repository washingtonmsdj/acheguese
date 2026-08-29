-- Repair the active private SafetyEvidenceService storage path on production.
--
-- The earlier 20260826032200 migration was not applied remotely and its policy
-- expression placed storage.foldername(name) inside a subquery that also joins
-- profiles. Because profiles has a name column, that correlation is ambiguous
-- and can bind to profile.name instead of storage.objects.name.
--
-- Keep the storage path contract explicit: first segment = safety_incident.id.
-- Only the direct owner of the profile that reported the incident may insert,
-- read/sign, or delete evidence objects. No UPDATE, anon, or public access.

BEGIN;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf'
    ],
    updated_at = now()
WHERE id = 'safety-evidence';

DROP POLICY IF EXISTS safety_evidence_storage_owner_insert ON storage.objects;
DROP POLICY IF EXISTS safety_evidence_storage_owner_select ON storage.objects;
DROP POLICY IF EXISTS safety_evidence_storage_owner_delete ON storage.objects;

CREATE POLICY safety_evidence_storage_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'safety-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT incident.id::text
      FROM public.safety_incidents incident
      JOIN public.profiles profile
        ON profile.id = incident.reported_by
      WHERE profile.user_id = auth.uid()
    )
  );

CREATE POLICY safety_evidence_storage_owner_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'safety-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT incident.id::text
      FROM public.safety_incidents incident
      JOIN public.profiles profile
        ON profile.id = incident.reported_by
      WHERE profile.user_id = auth.uid()
    )
  );

CREATE POLICY safety_evidence_storage_owner_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'safety-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT incident.id::text
      FROM public.safety_incidents incident
      JOIN public.profiles profile
        ON profile.id = incident.reported_by
      WHERE profile.user_id = auth.uid()
    )
  );

DO $verify$
DECLARE
  v_policy_count integer;
  v_bad_role_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'safety-evidence'
      AND public = false
      AND file_size_limit = 10485760
  ) THEN
    RAISE EXCEPTION 'safety-evidence bucket contract mismatch';
  END IF;

  SELECT count(*)
  INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'safety_evidence_storage_owner_insert',
      'safety_evidence_storage_owner_select',
      'safety_evidence_storage_owner_delete'
    )
    AND roles = ARRAY['authenticated']::name[];

  IF v_policy_count <> 3 THEN
    RAISE EXCEPTION 'safety-evidence owner policies missing or role mismatch';
  END IF;

  SELECT count(*)
  INTO v_bad_role_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'safety_evidence_storage_%'
    AND roles && ARRAY['public', 'anon']::name[];

  IF v_bad_role_count <> 0 THEN
    RAISE EXCEPTION 'safety-evidence public/anon policy detected';
  END IF;
END
$verify$;

COMMIT;
