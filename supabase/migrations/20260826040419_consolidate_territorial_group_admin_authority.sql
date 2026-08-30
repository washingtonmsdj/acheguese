-- Consolidate territorial group administration on the canonical global-admin
-- helper. Legacy policies queried user_roles directly and duplicated authority
-- while omitting parts of the canonical revoked/expiry/super-admin contract.

BEGIN;

DROP POLICY IF EXISTS "Admins manage territorial groups"
  ON public.territorial_groups;
DROP POLICY IF EXISTS "Admins view all territorial groups"
  ON public.territorial_groups;
DROP POLICY IF EXISTS "Admins manage territorial group members"
  ON public.territorial_group_members;
DROP POLICY IF EXISTS "Admins view all territorial group members"
  ON public.territorial_group_members;

DO $verify$
DECLARE
  v_table TEXT;
  v_policy_qual TEXT;
  v_policy_check TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'territorial_groups',
    'territorial_group_members'
  ]
  LOOP
    SELECT qual, with_check
    INTO v_policy_qual, v_policy_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_table
      AND policyname = CASE v_table
        WHEN 'territorial_groups'
          THEN 'Admins podem gerenciar grupos territoriais'
        ELSE 'Admins podem gerenciar membros de grupos'
      END
      AND cmd = 'ALL'
      AND roles @> ARRAY['authenticated']::NAME[];

    IF v_policy_qual IS NULL
       OR v_policy_check IS NULL
       OR v_policy_qual NOT ILIKE '%private.is_admin%'
       OR v_policy_check NOT ILIKE '%private.is_admin%' THEN
      RAISE EXCEPTION 'canonical territorial admin policy missing on %', v_table;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = v_table
        AND (
          COALESCE(qual, '') ILIKE '%FROM user_roles%'
          OR COALESCE(with_check, '') ILIKE '%FROM user_roles%'
        )
    ) THEN
      RAISE EXCEPTION 'direct user_roles territorial authority remains on %', v_table;
    END IF;
  END LOOP;
END
$verify$;

COMMIT;
