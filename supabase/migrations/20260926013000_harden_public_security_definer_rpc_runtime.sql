-- Harden the two anonymous/public SECURITY DEFINER read RPCs that still lacked
-- bounded execution time. Authorization predicates and EXECUTE grants are not
-- changed by this migration.
--
-- profile_public_territory_projection already schema-qualifies every relation,
-- so an empty search_path safely removes unnecessary name-resolution surface.

BEGIN;

ALTER FUNCTION public.get_community_poll_for_post(uuid)
  SET statement_timeout = '3s';

ALTER FUNCTION public.profile_public_territory_projection(uuid)
  SET statement_timeout = '3s';

ALTER FUNCTION public.profile_public_territory_projection(uuid)
  SET search_path = '';

COMMIT;
