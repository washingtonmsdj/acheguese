-- G5: reconcile stale function provenance after the 20260713133000 issue
-- hardening replaced the former Edge-only SECURITY DEFINER helper with an
-- authenticated SECURITY INVOKER wrapper over private.create_community_issue.

DO $g5_issue_rpc_comment_preflight$
DECLARE
  v_security_definer boolean;
  v_auth_exec boolean;
  v_service_exec boolean;
BEGIN
  SELECT p.prosecdef,
         has_function_privilege('authenticated', p.oid, 'EXECUTE'),
         has_function_privilege('service_role', p.oid, 'EXECUTE')
    INTO v_security_definer, v_auth_exec, v_service_exec
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'create_community_issue'
    AND pg_get_function_identity_arguments(p.oid) = 'payload jsonb';

  IF v_security_definer IS NULL THEN
    RAISE EXCEPTION
      'G5_ISSUE_RPC_PROVENANCE_BLOCKED: public.create_community_issue(jsonb) is missing';
  END IF;

  IF v_security_definer IS DISTINCT FROM FALSE
     OR v_auth_exec IS DISTINCT FROM TRUE
     OR v_service_exec IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION
      'G5_ISSUE_RPC_PROVENANCE_BLOCKED: live authority no longer matches authenticated invoker wrapper';
  END IF;

  IF position(
    'SELECT private.create_community_issue(payload)'
    IN pg_get_functiondef(to_regprocedure('public.create_community_issue(jsonb)'))
  ) = 0 THEN
    RAISE EXCEPTION
      'G5_ISSUE_RPC_PROVENANCE_BLOCKED: wrapper no longer delegates to private.create_community_issue';
  END IF;
END
$g5_issue_rpc_comment_preflight$;

COMMENT ON FUNCTION public.create_community_issue(jsonb) IS
  'Authenticated SECURITY INVOKER wrapper over private.create_community_issue. Browser execution is intentional; the private authority derives auth.uid(), active Profile and verified territorial residence.';
