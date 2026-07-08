-- Route authenticated business review mutations through the Edge broker.
-- Browser clients call business-reviews-rpc; direct execution of the backing
-- public functions is reserved for server-side service role only.

REVOKE ALL ON FUNCTION public.can_user_review_business(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_review_business(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_business_review(uuid, uuid, integer, text, text[], uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_review(uuid, uuid, integer, text, text[], uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_business_review(uuid, integer, text, text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_review(uuid, integer, text, text[])
  TO service_role;

REVOKE ALL ON FUNCTION public.delete_business_review(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_business_review(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.add_business_review_response(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_business_review_response(uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.can_user_review_business(uuid, uuid) IS
  'Server-side backing function. Browser access is routed through business-reviews-rpc.';
COMMENT ON FUNCTION public.create_business_review(uuid, uuid, integer, text, text[], uuid) IS
  'Server-side backing function. Browser access is routed through business-reviews-rpc.';
COMMENT ON FUNCTION public.update_business_review(uuid, integer, text, text[]) IS
  'Server-side backing function. Browser access is routed through business-reviews-rpc.';
COMMENT ON FUNCTION public.delete_business_review(uuid) IS
  'Server-side backing function. Browser access is routed through business-reviews-rpc.';
COMMENT ON FUNCTION public.add_business_review_response(uuid, text) IS
  'Server-side backing function. Browser access is routed through business-reviews-rpc.';

NOTIFY pgrst, 'reload schema';
