-- G5 Reviews provenance cleanup.
--
-- The Reviews SSOT classifies these functions as dormant legacy. The 2026-08-30
-- audit confirmed:
--   * no HEAD runtime caller;
--   * the five mutation/eligibility functions were service-role-only;
--   * get_business_reviews was no longer the canonical read path;
--   * no database object depends on any of the six functions;
--   * no function, view or RLS policy references them.
--
-- CASCADE is intentionally forbidden here. If a dependency reappears before
-- replay, PostgreSQL must fail the migration instead of deleting it implicitly.

DROP FUNCTION IF EXISTS public.can_user_review_business(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_business_review(
  uuid,
  uuid,
  integer,
  text,
  text[],
  uuid
);
DROP FUNCTION IF EXISTS public.update_business_review(uuid, integer, text, text[]);
DROP FUNCTION IF EXISTS public.delete_business_review(uuid);
DROP FUNCTION IF EXISTS public.add_business_review_response(uuid, text);
DROP FUNCTION IF EXISTS public.get_business_reviews(uuid, integer, integer);
