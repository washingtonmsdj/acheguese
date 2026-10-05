-- Mobility remains paused in the current MVP lifecycle.
-- Preserve the implementation for future reactivation while closing direct
-- browser-role reachability to Mobility-only operational SECURITY DEFINER RPCs.
-- Re-activation must explicitly re-grant after the module is re-certified.

BEGIN;

REVOKE ALL ON FUNCTION public.append_driver_moderation_event(uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_driver_moderation_event(uuid, text, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.ensure_owned_driver_data(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_owned_driver_data(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.ensure_ride_chat(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_ride_chat(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.get_operational_verification_status(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_operational_verification_status(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.mark_ride_chat_messages_read(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_ride_chat_messages_read(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.refresh_operational_pin_for_requester(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_operational_pin_for_requester(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.send_ride_chat_message(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_ride_chat_message(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.verify_operational_pin(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_operational_pin(uuid, text)
  TO service_role;

COMMIT;
