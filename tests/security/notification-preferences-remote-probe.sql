-- Transactional proof for partial notification preference patches.

BEGIN;

CREATE TEMP TABLE notification_preference_probe_fixture ON COMMIT DROP AS
SELECT account.id AS user_id
FROM auth.users account
ORDER BY account.created_at ASC, account.id ASC
LIMIT 1;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT fixture.user_id::TEXT FROM notification_preference_probe_fixture fixture),
  TRUE
);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (SELECT fixture.user_id FROM notification_preference_probe_fixture fixture),
    'role', 'authenticated'
  )::TEXT,
  TRUE
);

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_initial public.notification_preferences;
  v_channels public.notification_preferences;
  v_topics public.notification_preferences;
  v_frequency public.notification_preferences;
  v_quiet public.notification_preferences;
  v_cleared public.notification_preferences;
  v_direct_write_blocked BOOLEAN := FALSE;
BEGIN
  v_initial := public.get_current_notification_preferences();

  v_channels := public.patch_current_notification_preferences(
    p_email_enabled => NOT v_initial.email_enabled,
    p_push_enabled => NOT v_initial.push_enabled,
    p_inapp_enabled => NOT v_initial.inapp_enabled
  );
  IF v_channels.social_enabled IS DISTINCT FROM v_initial.social_enabled
     OR v_channels.system_enabled IS DISTINCT FROM v_initial.system_enabled
     OR v_channels.marketing_enabled IS DISTINCT FROM v_initial.marketing_enabled
     OR v_channels.frequency IS DISTINCT FROM v_initial.frequency
     OR v_channels.quiet_hours_start IS DISTINCT FROM v_initial.quiet_hours_start
     OR v_channels.quiet_hours_end IS DISTINCT FROM v_initial.quiet_hours_end THEN
    RAISE EXCEPTION 'channel_patch_clobbered_unrelated_fields';
  END IF;

  v_topics := public.patch_current_notification_preferences(
    p_social_enabled => NOT v_channels.social_enabled,
    p_system_enabled => NOT v_channels.system_enabled,
    p_marketing_enabled => NOT v_channels.marketing_enabled
  );
  IF v_topics.email_enabled IS DISTINCT FROM v_channels.email_enabled
     OR v_topics.push_enabled IS DISTINCT FROM v_channels.push_enabled
     OR v_topics.inapp_enabled IS DISTINCT FROM v_channels.inapp_enabled THEN
    RAISE EXCEPTION 'topic_patch_clobbered_channels';
  END IF;

  v_frequency := public.patch_current_notification_preferences(
    p_frequency => CASE WHEN v_topics.frequency = 'daily' THEN 'weekly' ELSE 'daily' END
  );
  IF v_frequency.email_enabled IS DISTINCT FROM v_topics.email_enabled
     OR v_frequency.social_enabled IS DISTINCT FROM v_topics.social_enabled THEN
    RAISE EXCEPTION 'frequency_patch_clobbered_preferences';
  END IF;

  v_quiet := public.patch_current_notification_preferences(
    p_quiet_hours_set => TRUE,
    p_quiet_hours_start => TIME '22:00',
    p_quiet_hours_end => TIME '08:00',
    p_quiet_hours_days => ARRAY[1,2,3,4,5]
  );
  IF v_quiet.quiet_hours_start <> TIME '22:00'
     OR v_quiet.quiet_hours_end <> TIME '08:00'
     OR v_quiet.quiet_hours_days <> ARRAY[1,2,3,4,5]
     OR v_quiet.frequency IS DISTINCT FROM v_frequency.frequency THEN
    RAISE EXCEPTION 'quiet_hours_patch_failed';
  END IF;

  v_cleared := public.patch_current_notification_preferences(
    p_quiet_hours_set => TRUE
  );
  IF v_cleared.quiet_hours_start IS NOT NULL
     OR v_cleared.quiet_hours_end IS NOT NULL
     OR v_cleared.transactional_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'quiet_hours_clear_or_transactional_invariant_failed';
  END IF;

  BEGIN
    UPDATE public.notification_preferences
    SET marketing_enabled = NOT marketing_enabled
    WHERE user_id = auth.uid();
  EXCEPTION WHEN insufficient_privilege THEN
    v_direct_write_blocked := TRUE;
  END;
  IF NOT v_direct_write_blocked THEN
    RAISE EXCEPTION 'direct_notification_preference_write_was_not_blocked';
  END IF;
END;
$$;

RESET ROLE;

DO $$
DECLARE
  v_user_id UUID := (
    SELECT fixture.user_id FROM notification_preference_probe_fixture fixture
  );
  v_changed_field_count INTEGER;
BEGIN
  SELECT count(*) INTO v_changed_field_count
  FROM private.notification_preferences_audit_log audit
  WHERE audit.user_id = v_user_id
    AND audit.created_at >= transaction_timestamp();
  IF v_changed_field_count <> 5 THEN
    RAISE EXCEPTION 'notification_preference_audit_count_%', v_changed_field_count;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM private.notification_preferences_audit_log audit
    WHERE audit.user_id = v_user_id
      AND audit.created_at >= transaction_timestamp()
      AND audit.changed_fields::TEXT ~ '(false|22:00|08:00|daily|weekly|immediate|never)'
  ) THEN
    RAISE EXCEPTION 'notification_preference_audit_contains_values';
  END IF;
  RAISE NOTICE 'notification_preferences_remote_probe_passed';
END;
$$;

ROLLBACK;
