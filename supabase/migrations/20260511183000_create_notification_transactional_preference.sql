-- Ensure create_notification honors transactional preference category.
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  IF NOT v_preferences.inapp_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'social' AND NOT v_preferences.social_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'system' AND NOT v_preferences.system_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'marketing' AND NOT v_preferences.marketing_enabled THEN
    RETURN NULL;
  END IF;

  IF p_category = 'transactional' AND NOT v_preferences.transactional_enabled THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
