-- create_community_alert used the oldest active profile owned by the user,
-- ignoring user_active_profiles and delegated active memberships. Reuse the
-- canonical resolver so browser and brokered calls publish from the profile the
-- actor is actually using.

DO $rewrite$
DECLARE
  v_def text;
  v_new text;
  v_old text := E'  SELECT profile.id\n  INTO v_profile_id\n  FROM public.profiles profile\n  WHERE profile.user_id = v_user_id\n    AND profile.is_active = TRUE\n  ORDER BY profile.created_at ASC\n  LIMIT 1;';
  v_replacement text := E'  SELECT profile.id\n  INTO v_profile_id\n  FROM public.get_active_profile(v_user_id) profile\n  LIMIT 1;';
BEGIN
  SELECT pg_get_functiondef('public.create_community_alert(jsonb)'::regprocedure)
  INTO v_def;

  v_new := replace(v_def, v_old, v_replacement);

  IF v_new = v_def THEN
    RAISE EXCEPTION 'legacy community alert profile resolver was not found';
  END IF;

  EXECUTE v_new;
END
$rewrite$;

DO $verify$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef('public.create_community_alert(jsonb)'::regprocedure)
  INTO v_def;

  IF v_def NOT ILIKE '%FROM public.get_active_profile(v_user_id)%' THEN
    RAISE EXCEPTION 'community alert RPC does not use canonical active profile resolver';
  END IF;

  IF v_def ILIKE '%ORDER BY profile.created_at ASC%'
     AND v_def ILIKE '%WHERE profile.user_id = v_user_id%' THEN
    RAISE EXCEPTION 'legacy oldest-profile resolver remains in community alert RPC';
  END IF;
END
$verify$;
