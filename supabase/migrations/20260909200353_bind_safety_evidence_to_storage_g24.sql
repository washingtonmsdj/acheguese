-- G24: bind Safety evidence records to real private Storage objects.
--
-- The browser may upload only into an incident-owned folder, but it must not
-- manufacture the evidence row. Registration derives uploader, canonical
-- storage reference, byte size and MIME from storage.objects. Registered
-- evidence objects become immutable to browser DELETE; orphan uploads remain
-- deletable so client compensation can clean failed registrations.

CREATE UNIQUE INDEX IF NOT EXISTS safety_evidence_file_url_unique
  ON public.safety_evidence(file_url);

CREATE OR REPLACE FUNCTION public.register_safety_evidence(
  p_incident_id uuid,
  p_evidence_type text,
  p_object_path text,
  p_file_name text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.safety_evidence
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_incident public.safety_incidents%ROWTYPE;
  v_object storage.objects%ROWTYPE;
  v_evidence public.safety_evidence%ROWTYPE;
  v_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_size bigint;
  v_mime text;
  v_reference text;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_incident_id IS NULL
     OR p_object_path IS NULL
     OR p_file_name IS NULL
  THEN
    RAISE EXCEPTION 'invalid_safety_evidence_registration'
      USING ERRCODE = '22023';
  END IF;

  IF p_evidence_type NOT IN (
    'photo','video','audio','screenshot','document'
  ) THEN
    RAISE EXCEPTION 'invalid_safety_evidence_type'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.char_length(pg_catalog.btrim(p_file_name)) NOT BETWEEN 1 AND 255
     OR p_file_name ~ '[<>[:cntrl:]]'
  THEN
    RAISE EXCEPTION 'invalid_safety_evidence_file_name'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(v_metadata) <> 'object'
     OR pg_catalog.pg_column_size(v_metadata) > 16384
  THEN
    RAISE EXCEPTION 'invalid_safety_evidence_metadata'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.char_length(p_object_path) > 1800
     OR p_object_path LIKE '/%'
     OR p_object_path LIKE '%..%'
     OR (storage.foldername(p_object_path))[1] IS DISTINCT FROM p_incident_id::text
  THEN
    RAISE EXCEPTION 'invalid_safety_evidence_object_path'
      USING ERRCODE = '22023';
  END IF;

  SELECT incident.*
  INTO v_incident
  FROM public.safety_incidents incident
  WHERE incident.id = p_incident_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'safety_incident_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_incident.reported_by IS DISTINCT FROM v_actor_profile_id THEN
    RAISE EXCEPTION 'safety_incident_reporter_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT object.*
  INTO v_object
  FROM storage.objects object
  WHERE object.bucket_id = 'safety-evidence'
    AND object.name = p_object_path
    AND object.archived_at IS NULL
    AND object.is_delete_marker = false
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'safety_evidence_object_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_object.owner_id IS DISTINCT FROM auth.uid()::text THEN
    RAISE EXCEPTION 'safety_evidence_object_owner_mismatch'
      USING ERRCODE = '42501';
  END IF;

  IF COALESCE(v_object.metadata ->> 'size', '') !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'safety_evidence_object_size_missing'
      USING ERRCODE = '22023';
  END IF;

  v_size := (v_object.metadata ->> 'size')::bigint;
  v_mime := NULLIF(v_object.metadata ->> 'mimetype', '');

  IF v_size < 1 OR v_size > 10485760 THEN
    RAISE EXCEPTION 'safety_evidence_object_size_invalid'
      USING ERRCODE = '22023';
  END IF;

  IF v_mime IS NULL OR v_mime NOT IN (
    'image/jpeg','image/png','image/webp',
    'video/mp4','video/webm',
    'audio/mpeg','audio/wav','audio/ogg',
    'application/pdf'
  ) THEN
    RAISE EXCEPTION 'safety_evidence_object_mime_invalid'
      USING ERRCODE = '22023';
  END IF;

  v_reference := 'storage://safety-evidence/' || p_object_path;

  INSERT INTO public.safety_evidence (
    incident_id,
    evidence_type,
    file_url,
    file_name,
    file_size,
    mime_type,
    uploaded_by,
    metadata
  )
  VALUES (
    p_incident_id,
    p_evidence_type,
    v_reference,
    pg_catalog.btrim(p_file_name),
    v_size,
    v_mime,
    v_actor_profile_id,
    v_metadata || pg_catalog.jsonb_build_object(
      'storage_object_id', v_object.id,
      'storage_created_at', v_object.created_at
    )
  )
  RETURNING * INTO v_evidence;

  RETURN v_evidence;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_safety_evidence(
  uuid, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_safety_evidence(
  uuid, text, text, text, jsonb
) TO authenticated, service_role;

REVOKE INSERT ON TABLE public.safety_evidence FROM authenticated;
DROP POLICY IF EXISTS safety_evidence_insert_own ON public.safety_evidence;

DROP POLICY IF EXISTS safety_evidence_storage_owner_delete ON storage.objects;
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
    AND NOT EXISTS (
      SELECT 1
      FROM public.safety_evidence evidence
      WHERE evidence.file_url =
        'storage://safety-evidence/' || storage.objects.name
    )
  );

COMMENT ON FUNCTION public.register_safety_evidence(
  uuid, text, text, text, jsonb
) IS
  'Registers Safety evidence only for an existing private safety-evidence object owned by the authenticated user and incident reporter. Canonical reference, byte size and MIME are derived from storage.objects.';
