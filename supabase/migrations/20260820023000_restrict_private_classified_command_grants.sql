-- Restrict direct browser execution of Classified Messaging internal commands.
--
-- The public SECURITY DEFINER wrappers are the browser authority surface and
-- already require auth.uid() while granting EXECUTE only to authenticated.
-- These private helpers are implementation details invoked by those wrappers;
-- they are not RLS helpers, trigger functions, views, or browser RPCs.
--
-- Preserve service_role for trusted server-side maintenance/diagnostics. Do not
-- change schema USAGE here because other private RLS helpers rely on that
-- broader schema contract.

REVOKE ALL ON FUNCTION private.create_classified_conversation(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.send_classified_message(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.mark_classified_messages_read(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.block_classified_conversation(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.moderate_classified_conversation(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.report_classified_comment(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.report_classified_conversation(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.report_classified_message(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.create_classified_conversation(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.send_classified_message(UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.mark_classified_messages_read(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.block_classified_conversation(UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.moderate_classified_conversation(UUID, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.report_classified_comment(UUID, UUID, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.report_classified_conversation(UUID, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.report_classified_message(UUID, TEXT, TEXT)
  TO service_role;
