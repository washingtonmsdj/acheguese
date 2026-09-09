
CREATE TABLE public.ride_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL UNIQUE REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ride_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.ride_chats(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_system_message boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ride_chat_messages_message_length_chk
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000)
);

CREATE INDEX ride_chat_messages_chat_created_idx
  ON public.ride_chat_messages(chat_id, created_at, id);
CREATE INDEX ride_chat_messages_unread_idx
  ON public.ride_chat_messages(chat_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.ride_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_chat_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.ride_chats FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.ride_chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ride_chats TO authenticated;
GRANT SELECT ON TABLE public.ride_chat_messages TO authenticated;
GRANT ALL ON TABLE public.ride_chats TO service_role;
GRANT ALL ON TABLE public.ride_chat_messages TO service_role;

CREATE POLICY ride_chats_select_participant
ON public.ride_chats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ride_requests ride
    WHERE ride.id = ride_chats.ride_id
      AND (SELECT private.current_active_profile_id()) IN (
        ride.passenger_profile_id,
        ride.driver_profile_id
      )
  )
);

CREATE POLICY ride_chat_messages_select_participant
ON public.ride_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ride_chats chat
    JOIN public.ride_requests ride
      ON ride.id = chat.ride_id
    WHERE chat.id = ride_chat_messages.chat_id
      AND (SELECT private.current_active_profile_id()) IN (
        ride.passenger_profile_id,
        ride.driver_profile_id
      )
  )
);

CREATE OR REPLACE FUNCTION public.ensure_ride_chat(p_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout = '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_chat public.ride_chats%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR v_actor_profile_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.driver_profile_id IS NULL
     OR v_actor_profile_id NOT IN (
       v_ride.passenger_profile_id,
       v_ride.driver_profile_id
     ) THEN
    RAISE EXCEPTION 'ride_chat_participant_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ride_chats(ride_id)
  VALUES (p_ride_id)
  ON CONFLICT (ride_id) DO NOTHING;

  SELECT chat.*
  INTO v_chat
  FROM public.ride_chats chat
  WHERE chat.ride_id = p_ride_id;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_chat.id,
    'ride_id', v_chat.ride_id,
    'created_at', v_chat.created_at,
    'updated_at', v_chat.updated_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_ride_chat_message(
  p_ride_id uuid,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout = '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_chat public.ride_chats%ROWTYPE;
  v_message public.ride_chat_messages%ROWTYPE;
  v_text text := NULLIF(pg_catalog.btrim(COALESCE(p_message, '')), '');
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF (SELECT auth.uid()) IS NULL OR v_actor_profile_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF v_text IS NULL OR pg_catalog.char_length(v_text) > 2000 THEN
    RAISE EXCEPTION 'invalid_ride_chat_message' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.driver_profile_id IS NULL
     OR v_actor_profile_id NOT IN (
       v_ride.passenger_profile_id,
       v_ride.driver_profile_id
     ) THEN
    RAISE EXCEPTION 'ride_chat_participant_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.status::text NOT IN (
    'driver_assigned',
    'driver_accepted',
    'accepted',
    'driver_arriving',
    'driver_on_the_way',
    'driver_arrived',
    'passenger_boarded',
    'passenger_on_board',
    'in_progress',
    'pickup_confirmed',
    'in_delivery'
  ) THEN
    RAISE EXCEPTION 'ride_chat_not_writable_in_current_state' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ride_chats(ride_id, created_at, updated_at)
  VALUES (p_ride_id, v_now, v_now)
  ON CONFLICT (ride_id)
  DO UPDATE SET updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_chat;

  INSERT INTO public.ride_chat_messages(
    chat_id,
    sender_profile_id,
    message,
    is_system_message,
    created_at
  )
  VALUES (
    v_chat.id,
    v_actor_profile_id,
    v_text,
    false,
    v_now
  )
  RETURNING * INTO v_message;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_message.id,
    'chat_id', v_message.chat_id,
    'sender_profile_id', v_message.sender_profile_id,
    'message', v_message.message,
    'is_system_message', v_message.is_system_message,
    'read_at', v_message.read_at,
    'created_at', v_message.created_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_ride_chat_messages_read(p_ride_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout = '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_chat_id uuid;
  v_count integer := 0;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR v_actor_profile_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND
     OR v_ride.driver_profile_id IS NULL
     OR v_actor_profile_id NOT IN (
       v_ride.passenger_profile_id,
       v_ride.driver_profile_id
     ) THEN
    RAISE EXCEPTION 'ride_chat_participant_required' USING ERRCODE = '42501';
  END IF;

  SELECT chat.id
  INTO v_chat_id
  FROM public.ride_chats chat
  WHERE chat.ride_id = p_ride_id;

  IF v_chat_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.ride_chat_messages message
  SET read_at = COALESCE(message.read_at, pg_catalog.clock_timestamp())
  WHERE message.chat_id = v_chat_id
    AND message.sender_profile_id <> v_actor_profile_id
    AND message.read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_ride_chat_summaries()
RETURNS TABLE(
  id uuid,
  ride_id uuid,
  passenger_profile_id uuid,
  driver_profile_id uuid,
  ride_status text,
  ride_mode text,
  origin text,
  destination text,
  final_price numeric,
  suggested_price numeric,
  created_at timestamptz,
  updated_at timestamptz,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
SET statement_timeout = '3s'
AS $function$
  SELECT
    chat.id,
    ride.id AS ride_id,
    ride.passenger_profile_id,
    ride.driver_profile_id,
    ride.status::text AS ride_status,
    ride.ride_mode::text AS ride_mode,
    ride.origin,
    ride.destination,
    ride.final_price,
    ride.suggested_price,
    chat.created_at,
    chat.updated_at,
    last_message.message AS last_message,
    last_message.created_at AS last_message_at,
    COALESCE(unread.unread_count, 0)::bigint AS unread_count
  FROM public.ride_chats chat
  JOIN public.ride_requests ride
    ON ride.id = chat.ride_id
  LEFT JOIN LATERAL (
    SELECT message.message, message.created_at
    FROM public.ride_chat_messages message
    WHERE message.chat_id = chat.id
    ORDER BY message.created_at DESC, message.id DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS unread_count
    FROM public.ride_chat_messages message
    WHERE message.chat_id = chat.id
      AND message.read_at IS NULL
      AND message.sender_profile_id <> (SELECT private.current_active_profile_id())
  ) unread ON true
  WHERE (SELECT private.current_active_profile_id()) IN (
    ride.passenger_profile_id,
    ride.driver_profile_id
  )
  ORDER BY COALESCE(last_message.created_at, chat.updated_at) DESC, chat.id DESC;
$function$;

REVOKE ALL ON FUNCTION public.ensure_ride_chat(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_ride_chat_message(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_ride_chat_messages_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_ride_chat_summaries() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ensure_ride_chat(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_ride_chat_message(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_ride_chat_messages_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_ride_chat_summaries() TO authenticated, service_role;

DO $publication$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ride_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_chat_messages;
  END IF;
END
$publication$;
