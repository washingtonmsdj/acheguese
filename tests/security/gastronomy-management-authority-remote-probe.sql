-- G6 Gastronomy management authorization probe.
-- Rollback-only. It never selects or mutates the preserved washingtonmsdj admin.
--
-- Proves:
-- 1. an authenticated user without Business management authority cannot update
--    the Gastronomy profile;
-- 2. the same technical user, with a temporary active admin membership, can
--    manage the Gastronomy profile, menu, category and item through RLS;
-- 3. all temporary state and no-op updates are rolled back.

BEGIN;

SELECT
  set_config('app.g6_gastronomy.business_id', bd.id::text, true),
  set_config('app.g6_gastronomy.profile_id', bd.profile_id::text, true),
  set_config('app.g6_gastronomy.menu_id', m.id::text, true),
  set_config('app.g6_gastronomy.category_id', mc.id::text, true),
  set_config('app.g6_gastronomy.item_id', mi.id::text, true)
FROM public.business_data bd
JOIN public.gastronomy_profiles gp ON gp.business_id = bd.id
JOIN public.menus m ON m.business_id = bd.id
JOIN public.menu_categories mc ON mc.menu_id = m.id
JOIN public.menu_items mi ON mi.category_id = mc.id
WHERE bd.status = 'active'
ORDER BY bd.created_at DESC, mi.id
LIMIT 1;

DO $$
BEGIN
  IF NULLIF(current_setting('app.g6_gastronomy.profile_id', true), '') IS NULL THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_requires_complete_fixture';
  END IF;
END
$$;

SELECT set_config('app.g6_gastronomy.candidate_user_id', u.id::text, true)
FROM auth.users u
WHERE u.id <> (
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.id = current_setting('app.g6_gastronomy.profile_id')::uuid
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.profile_id = current_setting('app.g6_gastronomy.profile_id')::uuid
      AND pm.user_id = u.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = u.id
      AND (
        lower(coalesce(p.handle, '')) = 'washingtonmsdj'
        OR lower(coalesce(p.username, '')) = 'washingtonmsdj'
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND (ur.role = 'admin' OR ur.role_enum = 'admin')
  )
ORDER BY u.created_at DESC
LIMIT 1;

DO $$
BEGIN
  IF NULLIF(current_setting('app.g6_gastronomy.candidate_user_id', true), '') IS NULL THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_requires_non_manager_fixture_user';
  END IF;
END
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.g6_gastronomy.candidate_user_id'),
  true
);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_profile_id uuid := current_setting('app.g6_gastronomy.profile_id')::uuid;
  v_business_id uuid := current_setting('app.g6_gastronomy.business_id')::uuid;
  v_rows integer;
BEGIN
  IF private.can_manage_profile(v_profile_id) THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_non_member_unexpectedly_authorized';
  END IF;

  UPDATE public.gastronomy_profiles
  SET cuisine_type = cuisine_type
  WHERE business_id = v_business_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_non_member_update_count_%', v_rows;
  END IF;
END
$$;

RESET ROLE;

INSERT INTO public.profile_members(profile_id, user_id, role, is_active)
VALUES (
  current_setting('app.g6_gastronomy.profile_id')::uuid,
  current_setting('app.g6_gastronomy.candidate_user_id')::uuid,
  'admin',
  true
);

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_profile_id uuid := current_setting('app.g6_gastronomy.profile_id')::uuid;
  v_business_id uuid := current_setting('app.g6_gastronomy.business_id')::uuid;
  v_menu_id uuid := current_setting('app.g6_gastronomy.menu_id')::uuid;
  v_category_id uuid := current_setting('app.g6_gastronomy.category_id')::uuid;
  v_item_id uuid := current_setting('app.g6_gastronomy.item_id')::uuid;
  v_rows integer;
BEGIN
  IF NOT private.can_manage_profile(v_profile_id) THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_admin_membership_not_authorized';
  END IF;

  UPDATE public.gastronomy_profiles
  SET cuisine_type = cuisine_type
  WHERE business_id = v_business_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_profile_update_count_%', v_rows;
  END IF;

  UPDATE public.menus SET name = name WHERE id = v_menu_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_menu_update_count_%', v_rows;
  END IF;

  UPDATE public.menu_categories SET name = name WHERE id = v_category_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_category_update_count_%', v_rows;
  END IF;

  UPDATE public.menu_items SET name = name WHERE id = v_item_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_gastronomy_probe_item_update_count_%', v_rows;
  END IF;
END
$$;

RESET ROLE;

SELECT jsonb_build_object(
  'status', 'pass',
  'negative_control', 'non-member update=0',
  'positive_control', 'temporary admin membership manages gastronomy profile/menu/category/item',
  'preserved_identity', 'washingtonmsdj excluded',
  'transaction', 'rollback'
) AS g6_gastronomy_management_probe;

ROLLBACK;
