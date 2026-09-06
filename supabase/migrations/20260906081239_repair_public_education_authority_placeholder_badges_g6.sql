-- G6 Education trust repair: institutional custody placeholders are not
-- authenticated/claimed government accounts and must not project the public
-- identity verification badge without canonical approved document evidence.

DO $$
DECLARE
  v_placeholder_count integer;
  v_approved_document_count integer;
  v_member_count integer;
BEGIN
  SELECT count(*)
  INTO v_placeholder_count
  FROM public.profiles
  WHERE slug IN (
    'prefeitura-de-salvador-educacao',
    'governo-da-bahia-educacao'
  );

  IF v_placeholder_count <> 2 THEN
    RAISE EXCEPTION 'education authority placeholder count mismatch: %', v_placeholder_count;
  END IF;

  SELECT count(*)
  INTO v_approved_document_count
  FROM public.verification v
  JOIN public.profiles p ON p.id = v.profile_id
  WHERE p.slug IN (
    'prefeitura-de-salvador-educacao',
    'governo-da-bahia-educacao'
  )
    AND v.verification_type = 'document'
    AND v.status = 'approved';

  IF v_approved_document_count <> 0 THEN
    RAISE EXCEPTION 'official authority placeholder has approved document verification: %',
      v_approved_document_count;
  END IF;

  SELECT count(*)
  INTO v_member_count
  FROM public.profile_members pm
  JOIN public.profiles p ON p.id = pm.profile_id
  WHERE p.slug IN (
    'prefeitura-de-salvador-educacao',
    'governo-da-bahia-educacao'
  );

  IF v_member_count <> 0 THEN
    RAISE EXCEPTION 'official authority placeholder already has claimed members: %', v_member_count;
  END IF;

  UPDATE public.profiles
  SET
    verified = false,
    verified_at = null,
    updated_at = now()
  WHERE slug IN (
    'prefeitura-de-salvador-educacao',
    'governo-da-bahia-educacao'
  )
    AND verified = true;

  IF (
    SELECT count(*)
    FROM public.profiles
    WHERE slug IN (
      'prefeitura-de-salvador-educacao',
      'governo-da-bahia-educacao'
    )
      AND verified = true
  ) <> 0 THEN
    RAISE EXCEPTION 'education authority placeholder badge repair failed';
  END IF;
END
$$;
