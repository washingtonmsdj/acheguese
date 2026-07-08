-- Route professional lead notifications through trusted brokers.
--
-- Lead creation can be anonymous, so it cannot rely on a JWT-only Edge
-- Function. The insert trigger remains the trusted authority for the
-- lead_created event and resolves the professional owner inside Postgres.

CREATE OR REPLACE FUNCTION public.create_professional_lead_created_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_owner_user_id uuid;
  v_preferences public.notification_preferences%ROWTYPE;
BEGIN
  INSERT INTO public.professional_lead_events (
    lead_id,
    event_type,
    actor_user_id,
    payload
  ) VALUES (
    NEW.id,
    'lead_created',
    NEW.requester_user_id,
    jsonb_build_object(
      'source_channel', NEW.source_channel,
      'service_needed', NEW.service_needed
    )
  );

  BEGIN
    SELECT p.user_id
    INTO v_owner_user_id
    FROM public.professional_data pd
    JOIN public.profiles p ON p.id = pd.profile_id
    WHERE pd.id = NEW.professional_id;

    IF v_owner_user_id IS NULL
      OR v_owner_user_id IS NOT DISTINCT FROM NEW.requester_user_id THEN
      RETURN NEW;
    END IF;

    SELECT *
    INTO v_preferences
    FROM public.notification_preferences
    WHERE user_id = v_owner_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.notification_preferences (user_id)
      VALUES (v_owner_user_id)
      ON CONFLICT (user_id) DO NOTHING;

      SELECT *
      INTO v_preferences
      FROM public.notification_preferences
      WHERE user_id = v_owner_user_id;
    END IF;

    IF v_preferences.user_id IS NULL
      OR NOT v_preferences.inapp_enabled
      OR NOT v_preferences.transactional_enabled THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications (
      user_id,
      type,
      category,
      title,
      message,
      action_url,
      action_label,
      metadata
    ) VALUES (
      v_owner_user_id,
      'info',
      'transactional',
      'Novo pedido de orcamento',
      format(
        '%s pediu orcamento para %s.',
        left(NEW.requester_name, 80),
        left(NEW.service_needed, 120)
      ),
      '/central/profissional',
      'Ver pedidos',
      jsonb_build_object(
        'domain', 'professional',
        'event', 'lead_created',
        'lead_id', NEW.id,
        'professional_id', NEW.professional_id,
        'source_channel', NEW.source_channel,
        'origin', 'professional_lead_trigger'
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'professional lead notification failed for lead %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.create_professional_lead_created_event()
  IS 'Internal trigger function for professional lead_created event and owner notification. Not exposed as a browser RPC.';

REVOKE ALL ON FUNCTION public.create_professional_lead_created_event()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_professional_lead_created_event()
  TO service_role;
