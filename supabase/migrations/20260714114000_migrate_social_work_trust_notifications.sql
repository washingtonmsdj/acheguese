-- Move trusted social, work and trust notification producers behind the Core
-- Platform notification contract. Browser input never selects the recipient.

-- Community keeps synchronous, transaction-bound materialization because each
-- social event has bounded fan-out. The implementation is now shared with the
-- outbox worker instead of duplicating preference and insert rules.
-- security-authority: internal-function private.create_community_social_notification
CREATE OR REPLACE FUNCTION private.create_community_social_notification(
  p_recipient_profile_id UUID,
  p_actor_profile_id UUID,
  p_event_type TEXT,
  p_dedupe_key TEXT,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recipient_user_id UUID;
  v_actor_name TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF p_recipient_profile_id IS NULL
     OR p_actor_profile_id IS NULL
     OR p_recipient_profile_id = p_actor_profile_id
     OR p_event_type NOT IN (
       'post_like',
       'post_comment',
       'comment_reply',
       'post_mention',
       'comment_mention'
     )
     OR p_dedupe_key !~ '^[a-z0-9:_-]{1,200}$' THEN
    RETURN NULL;
  END IF;

  SELECT recipient.user_id
  INTO v_recipient_user_id
  FROM public.profiles recipient
  WHERE recipient.id = p_recipient_profile_id;

  IF v_recipient_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    NULLIF(btrim(actor.display_name), ''),
    NULLIF(btrim(actor.name), ''),
    NULLIF(btrim(actor.username), ''),
    'Alguem'
  )
  INTO v_actor_name
  FROM public.profiles actor
  WHERE actor.id = p_actor_profile_id;

  IF v_actor_name IS NULL THEN
    RETURN NULL;
  END IF;

  CASE p_event_type
    WHEN 'post_like' THEN
      v_title := 'Novo like no seu post';
      v_message := v_actor_name || ' curtiu seu post';
    WHEN 'post_comment' THEN
      v_title := 'Novo comentario';
      v_message := v_actor_name || ' comentou no seu post';
    WHEN 'comment_reply' THEN
      v_title := 'Nova resposta no comentario';
      v_message := v_actor_name || ' respondeu seu comentario';
    WHEN 'post_mention' THEN
      v_title := 'Voce foi mencionado';
      v_message := v_actor_name || ' mencionou voce em uma publicacao';
    WHEN 'comment_mention' THEN
      v_title := 'Voce foi mencionado';
      v_message := v_actor_name || ' mencionou voce em um comentario';
  END CASE;

  RETURN private.materialize_notification(
    v_recipient_user_id,
    'community_' || p_event_type,
    'social',
    'medium',
    v_title,
    v_message,
    NULL,
    NULL,
    jsonb_strip_nulls(jsonb_build_object(
      'domain', 'community',
      'event', p_event_type,
      'post_id', p_post_id,
      'comment_id', p_comment_id,
      'actor_profile_id', p_actor_profile_id
    )),
    p_dedupe_key
  );
END;
$$;

REVOKE ALL ON FUNCTION private.create_community_social_notification(
  UUID, UUID, TEXT, TEXT, UUID, UUID
) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION private.create_community_social_notification(
  UUID, UUID, TEXT, TEXT, UUID, UUID
) IS
  'Transaction-bound Community adapter for the canonical private notification materializer.';

-- Work opportunities can fan out to multiple professionals, so the trigger
-- enqueues commands and leaves delivery to the concurrent worker.
-- security-authority: internal-function private.enqueue_work_opportunity_notifications
CREATE OR REPLACE FUNCTION private.enqueue_work_opportunity_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_candidate RECORD;
BEGIN
  IF NEW.published_at IS NULL
     OR NEW.status::TEXT <> 'active'
     OR NEW.visibility::TEXT NOT IN ('public_listed', 'public_unlisted')
     OR NEW.opportunity_type::TEXT NOT IN (
       'offering_work',
       'freelance',
       'quick_job'
     ) THEN
    RETURN NEW;
  END IF;

  FOR v_candidate IN
    SELECT
      professional.id AS professional_id,
      professional.owner_user_id
    FROM public.professional_data professional
    WHERE professional.service_category = NEW.professional_category
      AND professional.location_id = NEW.territory_location_id
      AND professional.is_accepting_clients = TRUE
      AND professional.visibility::TEXT IN ('public_listed', 'public_unlisted')
      AND professional.owner_user_id IS NOT NULL
      AND professional.owner_user_id IS DISTINCT FROM NEW.author_user_id
    ORDER BY professional.id ASC
    LIMIT 30
  LOOP
    PERFORM private.enqueue_notification(
      v_candidate.owner_user_id,
      'work_opportunity_match',
      'work_opportunity',
      NEW.id::TEXT,
      'info',
      'transactional',
      'medium',
      left('Nova oportunidade para ' || NEW.professional_category, 120),
      NEW.headline || ' na sua regiao.',
      '/oportunidades/' || NEW.id::TEXT,
      'Ver oportunidade',
      jsonb_build_object(
        'domain', 'work_opportunities',
        'event', 'professional_match',
        'opportunity_id', NEW.id,
        'professional_id', v_candidate.professional_id,
        'opportunity_type', NEW.opportunity_type,
        'territory_location_id', NEW.territory_location_id
      ),
      'work:opportunity:' || NEW.id::TEXT || ':' || v_candidate.professional_id::TEXT,
      now(),
      5::SMALLINT
    );
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_work_opportunity_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_work_opportunity_notifications_insert
  ON public.work_opportunities;
CREATE TRIGGER trg_enqueue_work_opportunity_notifications_insert
  AFTER INSERT ON public.work_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_work_opportunity_notifications();

DROP TRIGGER IF EXISTS trg_enqueue_work_opportunity_notifications_update
  ON public.work_opportunities;
CREATE TRIGGER trg_enqueue_work_opportunity_notifications_update
  AFTER UPDATE OF
    published_at,
    status,
    visibility,
    opportunity_type,
    professional_category,
    territory_location_id
  ON public.work_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_work_opportunity_notifications();

-- A published structured job uses the same professional candidate SSOT. The
-- existing timestamp is retained as the idempotent "matching scheduled" mark.
-- security-authority: internal-function private.enqueue_vaga_match_notifications
CREATE OR REPLACE FUNCTION private.enqueue_vaga_match_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_candidate RECORD;
  v_owner_user_id UUID;
  v_category TEXT;
  v_action_url TEXT := '/vagas';
  v_geographic_path TEXT;
  v_path_parts TEXT[];
BEGIN
  IF NEW.status::TEXT <> 'published'
     OR NEW.matching_notified_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_category := lower(btrim(COALESCE(NULLIF(NEW.categoria, ''), 'outro')));

  SELECT profile.user_id
  INTO v_owner_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.owner_profile_id;

  SELECT location.geographic_path
  INTO v_geographic_path
  FROM public.locations location
  WHERE location.id = NEW.location_id;

  IF NEW.slug IS NOT NULL AND v_geographic_path IS NOT NULL THEN
    v_path_parts := string_to_array(btrim(v_geographic_path, '/'), '/');
    IF array_length(v_path_parts, 1) >= 3
       AND v_path_parts[2] ~ '^[a-z0-9-]+$'
       AND v_path_parts[3] ~ '^[a-z0-9-]+$'
       AND NEW.slug ~ '^[a-z0-9-]+$' THEN
      v_action_url := '/vagas/' || v_path_parts[2] || '/' ||
        v_path_parts[3] || '/' || NEW.slug;
    END IF;
  END IF;

  FOR v_candidate IN
    SELECT
      professional.id AS professional_id,
      professional.owner_user_id
    FROM public.professional_data professional
    WHERE professional.service_category = v_category
      AND professional.location_id = NEW.location_id
      AND professional.is_accepting_clients = TRUE
      AND professional.visibility::TEXT IN ('public_listed', 'public_unlisted')
      AND professional.owner_user_id IS NOT NULL
      AND professional.owner_user_id IS DISTINCT FROM v_owner_user_id
    ORDER BY professional.id ASC
    LIMIT 30
  LOOP
    PERFORM private.enqueue_notification(
      v_candidate.owner_user_id,
      'vaga_professional_match',
      'vaga',
      NEW.id::TEXT,
      'info',
      'transactional',
      'medium',
      left('Nova vaga para ' || v_category, 120),
      NEW.titulo || ' na sua regiao.',
      v_action_url,
      'Ver vaga',
      jsonb_build_object(
        'domain', 'vagas',
        'event', 'professional_match',
        'vaga_id', NEW.id,
        'professional_id', v_candidate.professional_id,
        'matched_category', v_category,
        'territory_location_id', NEW.location_id
      ),
      'work:vaga:' || NEW.id::TEXT || ':' || v_candidate.professional_id::TEXT,
      now(),
      5::SMALLINT
    );
  END LOOP;

  NEW.matching_notified_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_vaga_match_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_vaga_match_notifications
  ON public.vagas;
CREATE TRIGGER trg_enqueue_vaga_match_notifications
  BEFORE INSERT OR UPDATE OF
    status,
    categoria,
    location_id,
    owner_profile_id,
    slug,
    matching_notified_at
  ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_vaga_match_notifications();

-- security-authority: internal-function private.trust_notification_action_url
CREATE OR REPLACE FUNCTION private.trust_notification_action_url(
  p_context_type TEXT,
  p_context_id UUID
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE p_context_type
    WHEN 'order' THEN '/gastronomia/pedidos/' || p_context_id::TEXT
    WHEN 'delivery' THEN '/central/motoboy/entregas'
    WHEN 'ride' THEN '/central/motoboy/entregas'
    WHEN 'classified' THEN '/classificados'
    WHEN 'service' THEN '/central/profissional'
    WHEN 'community' THEN '/comunidade'
    ELSE '/admin/moderacao'
  END;
$$;

REVOKE ALL ON FUNCTION private.trust_notification_action_url(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.enqueue_trust_event_notifications
CREATE OR REPLACE FUNCTION private.enqueue_trust_event_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_subject_user_id UUID;
  v_actor_user_id UUID;
  v_action_url TEXT;
  v_notification_type TEXT;
BEGIN
  SELECT profile.user_id
  INTO v_subject_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.subject_profile_id;

  SELECT profile.user_id
  INTO v_actor_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.actor_profile_id;

  v_action_url := private.trust_notification_action_url(
    NEW.context_type::TEXT,
    NEW.context_id
  );
  v_notification_type := CASE
    WHEN NEW.severity::TEXT IN ('critical', 'high') THEN 'warning'
    ELSE 'info'
  END;

  IF v_subject_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      v_subject_user_id,
      'trust_event_created',
      'trust_event',
      NEW.id::TEXT,
      v_notification_type,
      'transactional',
      CASE
        WHEN NEW.severity::TEXT IN ('critical', 'high') THEN 'high'
        ELSE 'medium'
      END,
      'Evento de confianca registrado',
      'Um evento operacional foi registrado no seu perfil e pode impactar prioridade de chamados.',
      v_action_url,
      'Ver contexto',
      jsonb_build_object(
        'source', 'trust_event',
        'event', 'trust_event_created',
        'trust_event_id', NEW.id,
        'context_type', NEW.context_type,
        'context_id', NEW.context_id,
        'event_type', NEW.event_type,
        'reason_code', NEW.reason_code,
        'severity', NEW.severity,
        'status', NEW.status,
        'audience', 'subject'
      ),
      'trust:event:' || NEW.id::TEXT || ':subject',
      now(),
      5::SMALLINT
    );
  END IF;

  IF v_actor_user_id IS NOT NULL
     AND v_actor_user_id IS DISTINCT FROM v_subject_user_id THEN
    PERFORM private.enqueue_notification(
      v_actor_user_id,
      'trust_feedback_recorded',
      'trust_event',
      NEW.id::TEXT,
      'info',
      'transactional',
      'medium',
      'Feedback registrado',
      'Seu feedback operacional foi recebido para analise administrativa.',
      v_action_url,
      'Ver contexto',
      jsonb_build_object(
        'source', 'trust_event',
        'event', 'trust_feedback_recorded',
        'trust_event_id', NEW.id,
        'context_type', NEW.context_type,
        'context_id', NEW.context_id,
        'event_type', NEW.event_type,
        'reason_code', NEW.reason_code,
        'severity', NEW.severity,
        'status', NEW.status,
        'audience', 'actor'
      ),
      'trust:event:' || NEW.id::TEXT || ':actor',
      now(),
      5::SMALLINT
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_trust_event_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_trust_event_notifications
  ON public.trust_events;
CREATE TRIGGER trg_enqueue_trust_event_notifications
  AFTER INSERT ON public.trust_events
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_trust_event_notifications();

-- security-authority: internal-function private.enqueue_trust_admin_action_notifications
CREATE OR REPLACE FUNCTION private.enqueue_trust_admin_action_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_subject_user_id UUID;
  v_admin_user_id UUID;
  v_context_type TEXT;
  v_context_id UUID;
  v_subject_action_url TEXT := '/conta';
BEGIN
  SELECT profile.user_id
  INTO v_subject_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.subject_profile_id;

  SELECT profile.user_id
  INTO v_admin_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.applied_by_profile_id;

  IF NEW.trust_event_id IS NOT NULL THEN
    SELECT event.context_type::TEXT, event.context_id
    INTO v_context_type, v_context_id
    FROM public.trust_events event
    WHERE event.id = NEW.trust_event_id;

    IF v_context_type IS NOT NULL THEN
      v_subject_action_url := private.trust_notification_action_url(
        v_context_type,
        v_context_id
      );
    END IF;
  END IF;

  IF v_subject_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      v_subject_user_id,
      'trust_admin_action_applied',
      'trust_admin_action',
      NEW.id::TEXT,
      CASE
        WHEN NEW.action_type = 'clear_restriction' THEN 'success'
        ELSE 'warning'
      END,
      'transactional',
      'high',
      'Atualizacao administrativa de confianca',
      CASE
        WHEN NEW.action_type = 'clear_restriction' THEN
          'Sua restricao operacional foi removida.'
        ELSE 'Uma acao administrativa foi aplicada no seu perfil.'
      END,
      v_subject_action_url,
      'Ver contexto',
      jsonb_build_object(
        'source', 'trust_admin_action',
        'event', 'trust_admin_action_applied',
        'trust_admin_action_id', NEW.id,
        'trust_event_id', NEW.trust_event_id,
        'subject_profile_id', NEW.subject_profile_id,
        'subject_role', NEW.subject_role,
        'action_type', NEW.action_type,
        'audience', 'subject'
      ),
      'trust:action:' || NEW.id::TEXT || ':subject',
      now(),
      5::SMALLINT
    );
  END IF;

  IF v_admin_user_id IS NOT NULL
     AND v_admin_user_id IS DISTINCT FROM v_subject_user_id THEN
    PERFORM private.enqueue_notification(
      v_admin_user_id,
      'trust_admin_action_confirmed',
      'trust_admin_action',
      NEW.id::TEXT,
      'success',
      'transactional',
      'medium',
      'Acao administrativa aplicada',
      'A acao de confianca foi registrada com sucesso no SSOT.',
      '/admin/moderacao',
      'Ver fila',
      jsonb_build_object(
        'source', 'trust_admin_action',
        'event', 'trust_admin_action_confirmed',
        'trust_admin_action_id', NEW.id,
        'trust_event_id', NEW.trust_event_id,
        'subject_profile_id', NEW.subject_profile_id,
        'subject_role', NEW.subject_role,
        'action_type', NEW.action_type,
        'audience', 'admin'
      ),
      'trust:action:' || NEW.id::TEXT || ':admin',
      now(),
      5::SMALLINT
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_trust_admin_action_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_trust_admin_action_notifications
  ON public.trust_admin_actions;
CREATE TRIGGER trg_enqueue_trust_admin_action_notifications
  AFTER INSERT ON public.trust_admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_trust_admin_action_notifications();
