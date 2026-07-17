-- Make authentication guards explicit at every public Trust/Messaging RPC.
-- Private commands already validate auth and authorization; this public layer
-- is defense in depth and keeps migration hygiene machine-verifiable.

-- security-authority: public-rpc public.create_classified_conversation
CREATE OR REPLACE FUNCTION public.create_classified_conversation(p_classified_id UUID)
RETURNS public.conversations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.create_classified_conversation(p_classified_id);
END;
$$;

-- security-authority: public-rpc public.send_classified_message
CREATE OR REPLACE FUNCTION public.send_classified_message(
  p_conversation_id UUID, p_text TEXT
)
RETURNS public.messages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.send_classified_message(p_conversation_id, p_text);
END;
$$;

-- security-authority: public-rpc public.mark_classified_messages_read
CREATE OR REPLACE FUNCTION public.mark_classified_messages_read(p_conversation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.mark_classified_messages_read(p_conversation_id);
END;
$$;

-- security-authority: public-rpc public.block_classified_conversation
CREATE OR REPLACE FUNCTION public.block_classified_conversation(
  p_conversation_id UUID, p_reason TEXT DEFAULT 'user_blocked'
)
RETURNS public.conversations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.block_classified_conversation(p_conversation_id, p_reason);
END;
$$;

-- security-authority: public-rpc public.moderate_classified_conversation
CREATE OR REPLACE FUNCTION public.moderate_classified_conversation(
  p_conversation_id UUID, p_action TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS public.conversations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.moderate_classified_conversation(
    p_conversation_id, p_action, p_reason
  );
END;
$$;

-- security-authority: public-rpc public.report_classified_comment
CREATE OR REPLACE FUNCTION public.report_classified_comment(
  p_classified_id UUID, p_comment_id UUID, p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.report_classified_comment(
    p_classified_id, p_comment_id, p_reason, p_description
  );
END;
$$;

-- security-authority: public-rpc public.report_classified_conversation
CREATE OR REPLACE FUNCTION public.report_classified_conversation(
  p_conversation_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.report_classified_conversation(
    p_conversation_id, p_reason, p_description
  );
END;
$$;

-- security-authority: public-rpc public.report_classified_message
CREATE OR REPLACE FUNCTION public.report_classified_message(
  p_message_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.report_classified_message(p_message_id, p_reason, p_description);
END;
$$;

REVOKE ALL ON FUNCTION public.create_classified_conversation(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_classified_message(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_classified_messages_read(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_classified_conversation(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_classified_conversation(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_comment(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_conversation(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_message(UUID, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_classified_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_classified_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_classified_messages_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_classified_conversation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_classified_conversation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_comment(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_conversation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_message(UUID, TEXT, TEXT) TO authenticated;
