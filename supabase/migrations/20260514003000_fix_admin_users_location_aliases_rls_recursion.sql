BEGIN;

-- Canonical helper that does not depend on admin_users (avoids policy recursion).
CREATE OR REPLACE FUNCTION public.is_admin_from_roles(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.revoked_at IS NULL
      AND ur.role_enum IN ('admin'::public.app_role, 'super_admin'::public.app_role)
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_from_roles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_from_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_from_roles(UUID) TO service_role;

-- Keep legacy helpers aligned with SSOT (user_roles only).
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin_from_roles(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin_from_roles(p_user_id);
$$;

-- Drop all existing policies on admin_users to remove recursive rules.
DO $$
DECLARE
  p RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) THEN
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'admin_users'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', p.policyname);
    END LOOP;

    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

    CREATE POLICY admin_users_self_read
      ON public.admin_users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR public.is_admin_from_roles(auth.uid()));

    CREATE POLICY admin_users_admin_manage
      ON public.admin_users
      FOR ALL
      TO authenticated
      USING (public.is_admin_from_roles(auth.uid()))
      WITH CHECK (public.is_admin_from_roles(auth.uid()));
  END IF;
END
$$;

-- Drop all existing policies on location_aliases and recreate non-recursive rules.
DO $$
DECLARE
  p RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'location_aliases'
  ) THEN
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'location_aliases'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.location_aliases', p.policyname);
    END LOOP;

    ALTER TABLE public.location_aliases ENABLE ROW LEVEL SECURITY;

    CREATE POLICY location_aliases_public_read
      ON public.location_aliases
      FOR SELECT
      TO anon, authenticated
      USING (
        valid_until IS NULL OR valid_until >= now()
      );

    CREATE POLICY location_aliases_admin_manage
      ON public.location_aliases
      FOR ALL
      TO authenticated
      USING (public.is_admin_from_roles(auth.uid()))
      WITH CHECK (public.is_admin_from_roles(auth.uid()));
  END IF;
END
$$;

COMMIT;
