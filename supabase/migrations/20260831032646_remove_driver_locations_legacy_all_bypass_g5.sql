BEGIN;

DO $pre$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='Drivers manage own location'
    AND cmd='ALL'
    AND roles=ARRAY['authenticated']::name[]
    AND permissive='PERMISSIVE'
    AND qual LIKE '%profiles.user_id = ( SELECT auth.uid() AS uid)%';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: legacy driver_locations ALL policy contract changed';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='driver_locations_authorized_read'
    AND cmd='SELECT'
    AND roles=ARRAY['authenticated']::name[];
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: canonical driver_locations read policy missing';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='driver_locations_insert_policy'
    AND cmd='INSERT'
    AND roles=ARRAY['authenticated']::name[]
    AND with_check LIKE '%profile_type = ''driver''%';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: driver-only INSERT policy missing';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='driver_locations_update_policy'
    AND cmd='UPDATE'
    AND roles=ARRAY['authenticated']::name[]
    AND qual LIKE '%profile_type = ''driver''%'
    AND with_check LIKE '%profile_type = ''driver''%';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: driver-only UPDATE policy missing';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='driver_locations_delete_policy'
    AND cmd='DELETE'
    AND roles=ARRAY['authenticated']::name[]
    AND qual LIKE '%profile_type = ''driver''%';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: driver-only DELETE policy missing';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.driver_locations dl
  LEFT JOIN public.profiles p ON p.id=dl.driver_profile_id
  WHERE p.id IS NULL OR p.profile_type <> 'driver';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 precondition failed: % existing driver_locations rows are not backed by driver profiles', v_count;
  END IF;
END
$pre$;

DROP POLICY "Drivers manage own location" ON public.driver_locations;

DO $post$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname='Drivers manage own location';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 postcondition failed: legacy driver_locations ALL policy still exists';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='driver_locations'
    AND policyname IN (
      'driver_locations_authorized_read',
      'driver_locations_insert_policy',
      'driver_locations_update_policy',
      'driver_locations_delete_policy'
    );
  IF v_count <> 4 THEN
    RAISE EXCEPTION 'G5 postcondition failed: canonical driver_locations policy set is incomplete';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.driver_locations dl
  LEFT JOIN public.profiles p ON p.id=dl.driver_profile_id
  WHERE p.id IS NULL OR p.profile_type <> 'driver';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 postcondition failed: invalid driver_locations rows detected';
  END IF;
END
$post$;

COMMIT;
