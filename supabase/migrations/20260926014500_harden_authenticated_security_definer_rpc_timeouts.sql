-- Bound authenticated SECURITY DEFINER RPC execution time without changing
-- authorization, ownership, function bodies, grants, or search_path.
--
-- Timeouts follow the existing project convention:
--   2s: trivial authenticated reads
--   3s: normal transactional/wrapper operations
--   5s: heavier aggregation or multi-step creation flows

-- Trivial reads.
ALTER FUNCTION public.current_user_has_password()
  SET statement_timeout = '2s';

ALTER FUNCTION public.get_current_notification_preferences()
  SET statement_timeout = '2s';

ALTER FUNCTION public.is_current_user_business_favorite(uuid)
  SET statement_timeout = '2s';

-- Normal authenticated operations.
ALTER FUNCTION public.block_classified_conversation(uuid, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.cast_community_poll_vote(uuid, uuid, uuid)
  SET statement_timeout = '3s';

ALTER FUNCTION public.create_classified_conversation(uuid)
  SET statement_timeout = '3s';

ALTER FUNCTION public.get_current_user_business_favorite_ids(uuid[])
  SET statement_timeout = '3s';

ALTER FUNCTION public.get_current_user_business_favorites(integer, integer, text[])
  SET statement_timeout = '3s';

ALTER FUNCTION public.list_group_message_reaction_state(uuid[])
  SET statement_timeout = '3s';

ALTER FUNCTION public.mark_classified_messages_read(uuid)
  SET statement_timeout = '3s';

ALTER FUNCTION public.moderate_classified_conversation(uuid, text, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.patch_current_notification_preferences(
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  boolean,
  time without time zone,
  time without time zone,
  integer[]
)
  SET statement_timeout = '3s';

ALTER FUNCTION public.patch_current_user_business_favorite(
  uuid,
  boolean,
  boolean,
  boolean,
  text,
  boolean,
  text[]
)
  SET statement_timeout = '3s';

ALTER FUNCTION public.report_classified_comment(uuid, uuid, text, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.report_classified_conversation(uuid, text, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.report_classified_message(uuid, text, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.request_profile_verification(uuid, text, text, text, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.send_classified_message(uuid, text)
  SET statement_timeout = '3s';

ALTER FUNCTION public.set_current_user_business_favorite(uuid, boolean)
  SET statement_timeout = '3s';

ALTER FUNCTION public.toggle_group_message_like(uuid)
  SET statement_timeout = '3s';

-- Heavier aggregation / multi-step flows.
ALTER FUNCTION public.create_post_with_poll(jsonb)
  SET statement_timeout = '5s';

ALTER FUNCTION public.get_community_rpc_operational_metrics(integer)
  SET statement_timeout = '5s';

ALTER FUNCTION public.get_community_rpc_slo_status(integer, integer, numeric, integer)
  SET statement_timeout = '5s';
