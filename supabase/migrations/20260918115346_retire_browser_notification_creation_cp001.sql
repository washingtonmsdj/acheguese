-- CP-001: retire the unused generic browser notification creation capability.
-- Cross-user producers already use trusted brokers, domain triggers, or the private outbox.
-- Keep the existing materializer server-owned without changing its behavior.

REVOKE ALL ON FUNCTION public.create_notification(
  uuid, text, text, text, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_notification(
  uuid, text, text, text, text, text, text, text, jsonb
) TO service_role;

COMMENT ON FUNCTION public.create_notification(
  uuid, text, text, text, text, text, text, text, jsonb
) IS 'Server-owned notification materializer. Browser execution is retired; trusted producers use service_role brokers, triggers, or the private notification outbox.';
