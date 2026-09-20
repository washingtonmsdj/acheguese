-- G36C3 contract: retire the generic public profile-create bridge and the
-- browser-callable admin driver bootstrap after both domain brokers were
-- deployed and proven live. No CASCADE: unexpected dependencies fail closed.

DROP FUNCTION IF EXISTS public.profile_rpc_create_profile_with_extension(
  uuid, text, text, text, text, text, jsonb
);

DROP FUNCTION IF EXISTS public.ensure_admin_driver_data(uuid);
