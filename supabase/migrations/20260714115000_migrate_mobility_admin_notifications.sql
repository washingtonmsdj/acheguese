-- Move operational Mobility, Orders and Business Claim notifications to
-- trusted database producers. Recipients are derived from canonical rows.

-- security-authority: internal-function private.enqueue_ride_transition_notifications
CREATE OR REPLACE FUNCTION private.enqueue_ride_transition_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_passenger_user_id UUID;
  v_driver_user_id UUID;
  v_state TEXT := NEW.status;
  v_is_delivery BOOLEAN := NEW.ride_mode = 'motoboy';
  v_passenger_url TEXT := '/mobilidade/buscando/' || NEW.id::TEXT;
  v_driver_url TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status
     OR v_state NOT IN (
       'driver_accepted',
       'in_progress',
       'in_delivery',
       'delivered',
       'completed',
       'cancelled_by_driver',
       'cancelled_by_passenger'
     ) THEN
    RETURN NEW;
  END IF;

  SELECT profile.user_id
  INTO v_passenger_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.passenger_profile_id;

  SELECT profile.user_id
  INTO v_driver_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.driver_profile_id;

  v_driver_url := CASE
    WHEN v_is_delivery THEN '/central/motoboy/entregas'
    ELSE '/central/motorista/corridas'
  END;

  IF v_passenger_user_id IS NOT NULL THEN
    IF v_state = 'driver_accepted' THEN
      PERFORM private.enqueue_notification(
        v_passenger_user_id,
        'ride_driver_accepted',
        'ride',
        NEW.id::TEXT,
        'success',
        'transactional',
        'medium',
        'Motorista confirmou a corrida',
        'Seu motorista confirmou o aceite e vai iniciar em breve.',
        v_passenger_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', 'ride_driver_accepted',
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'passenger',
          'ride_mode', CASE WHEN v_is_delivery THEN 'motoboy' ELSE 'ride' END
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':passenger',
        now(),
        5::SMALLINT
      );
    ELSIF v_state = 'in_progress' THEN
      PERFORM private.enqueue_notification(
        v_passenger_user_id,
        'ride_in_progress',
        'ride',
        NEW.id::TEXT,
        'info',
        'transactional',
        'medium',
        'Corrida iniciada',
        'Sua corrida foi iniciada.',
        v_passenger_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', 'ride_in_progress',
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'passenger',
          'ride_mode', 'ride'
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':passenger',
        now(),
        5::SMALLINT
      );
    ELSIF v_state = 'in_delivery' THEN
      PERFORM private.enqueue_notification(
        v_passenger_user_id,
        'delivery_in_route',
        'ride',
        NEW.id::TEXT,
        'info',
        'transactional',
        'medium',
        'Entrega em rota',
        'Seu motoboy iniciou a rota.',
        v_passenger_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', 'delivery_in_route',
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'passenger',
          'ride_mode', 'motoboy'
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':passenger',
        now(),
        5::SMALLINT
      );
    ELSIF v_state IN ('delivered', 'completed') THEN
      PERFORM private.enqueue_notification(
        v_passenger_user_id,
        CASE WHEN v_state = 'delivered' THEN 'delivery_completed' ELSE 'ride_completed' END,
        'ride',
        NEW.id::TEXT,
        'success',
        'transactional',
        'medium',
        CASE WHEN v_state = 'delivered' THEN 'Entrega concluida' ELSE 'Corrida concluida' END,
        'Operacao finalizada com sucesso.',
        v_passenger_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', CASE WHEN v_state = 'delivered' THEN 'delivery_completed' ELSE 'ride_completed' END,
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'passenger',
          'ride_mode', CASE WHEN v_is_delivery THEN 'motoboy' ELSE 'ride' END
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':passenger',
        now(),
        5::SMALLINT
      );
    ELSIF v_state IN ('cancelled_by_driver', 'cancelled_by_passenger') THEN
      PERFORM private.enqueue_notification(
        v_passenger_user_id,
        CASE
          WHEN v_state = 'cancelled_by_driver' THEN 'ride_canceled_by_driver'
          ELSE 'ride_canceled_by_passenger'
        END,
        'ride',
        NEW.id::TEXT,
        'warning',
        'transactional',
        'high',
        'Corrida cancelada',
        'A corrida foi cancelada.',
        v_passenger_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', CASE
            WHEN v_state = 'cancelled_by_driver' THEN 'ride_canceled_by_driver'
            ELSE 'ride_canceled_by_passenger'
          END,
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'passenger',
          'ride_mode', CASE WHEN v_is_delivery THEN 'motoboy' ELSE 'ride' END
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':passenger',
        now(),
        5::SMALLINT
      );
    END IF;
  END IF;

  IF v_driver_user_id IS NOT NULL
     AND v_driver_user_id IS DISTINCT FROM v_passenger_user_id THEN
    IF v_state IN ('delivered', 'completed') THEN
      PERFORM private.enqueue_notification(
        v_driver_user_id,
        'mobility_operation_completed',
        'ride',
        NEW.id::TEXT,
        'success',
        'transactional',
        'medium',
        'Operacao concluida',
        'A operacao foi finalizada e registrada no historico.',
        v_driver_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', 'operation_completed',
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'driver',
          'ride_mode', CASE WHEN v_is_delivery THEN 'motoboy' ELSE 'ride' END
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':driver',
        now(),
        5::SMALLINT
      );
    ELSIF v_state IN ('cancelled_by_driver', 'cancelled_by_passenger') THEN
      PERFORM private.enqueue_notification(
        v_driver_user_id,
        CASE
          WHEN v_state = 'cancelled_by_driver' THEN 'ride_canceled_by_driver'
          ELSE 'ride_canceled_by_passenger'
        END,
        'ride',
        NEW.id::TEXT,
        'warning',
        'transactional',
        'high',
        'Corrida cancelada',
        'A corrida foi cancelada.',
        v_driver_url,
        'Ver detalhes',
        jsonb_build_object(
          'domain', 'mobility',
          'event', CASE
            WHEN v_state = 'cancelled_by_driver' THEN 'ride_canceled_by_driver'
            ELSE 'ride_canceled_by_passenger'
          END,
          'ride_id', NEW.id,
          'state', v_state,
          'audience', 'driver',
          'ride_mode', CASE WHEN v_is_delivery THEN 'motoboy' ELSE 'ride' END
        ),
        'mobility:ride:' || NEW.id::TEXT || ':' || v_state || ':driver',
        now(),
        5::SMALLINT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_ride_transition_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_ride_transition_notifications
  ON public.ride_requests;
CREATE TRIGGER trg_enqueue_ride_transition_notifications
  AFTER UPDATE OF status ON public.ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_ride_transition_notifications();

-- security-authority: internal-function private.enqueue_order_notifications
CREATE OR REPLACE FUNCTION private.enqueue_order_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_customer_user_id UUID;
  v_merchant_user_id UUID;
  v_courier_user_id UUID;
  v_event TEXT;
  v_event_label TEXT;
  v_status TEXT := NEW.logistics_status::TEXT;
  v_status_label TEXT;
  v_notification_type TEXT;
  v_priority TEXT;
  v_title TEXT;
  v_customer_message TEXT;
  v_merchant_message TEXT;
  v_courier_message TEXT;
  v_customer_url TEXT;
  v_merchant_url TEXT;
  v_idempotency_key TEXT;
  v_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'order_created';
  ELSIF OLD.logistics_status IS DISTINCT FROM NEW.logistics_status THEN
    v_event := CASE v_status
      WHEN 'accepted' THEN 'order_accepted'
      WHEN 'preparing' THEN 'order_preparing'
      WHEN 'ready_for_pickup' THEN 'order_ready_for_pickup'
      WHEN 'picked_up' THEN 'courier_picked_up'
      WHEN 'delivered' THEN 'order_delivered'
      WHEN 'canceled' THEN 'order_canceled'
      WHEN 'failed' THEN 'delivery_failed'
      ELSE 'order_status_changed'
    END;
  ELSIF OLD.proof_of_delivery IS DISTINCT FROM NEW.proof_of_delivery THEN
    v_event := 'delivery_proof_attached';
  ELSE
    RETURN NEW;
  END IF;

  SELECT profile.user_id
  INTO v_customer_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.customer_profile_id;

  SELECT profile.user_id
  INTO v_merchant_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.merchant_profile_id;

  SELECT profile.user_id
  INTO v_courier_user_id
  FROM public.profiles profile
  WHERE profile.id = NEW.courier_profile_id;

  v_status_label := CASE v_status
    WHEN 'pending' THEN 'Pedido recebido'
    WHEN 'accepted' THEN 'Pedido aceito'
    WHEN 'preparing' THEN 'Pedido em preparo'
    WHEN 'ready_for_pickup' THEN 'Pedido pronto para retirada'
    WHEN 'picked_up' THEN 'Pedido saiu para entrega'
    WHEN 'delivered' THEN 'Pedido entregue'
    WHEN 'canceled' THEN 'Pedido cancelado'
    WHEN 'failed' THEN 'Falha na entrega'
    ELSE 'Status atualizado'
  END;

  v_event_label := CASE v_event
    WHEN 'order_created' THEN 'Pedido criado'
    WHEN 'order_accepted' THEN 'Pedido aceito pela loja'
    WHEN 'order_preparing' THEN 'Pedido em preparo'
    WHEN 'order_ready_for_pickup' THEN 'Pedido pronto para coleta'
    WHEN 'courier_picked_up' THEN 'Pedido retirado'
    WHEN 'order_delivered' THEN 'Pedido entregue'
    WHEN 'order_canceled' THEN 'Pedido cancelado'
    WHEN 'delivery_failed' THEN 'Falha de entrega'
    WHEN 'delivery_proof_attached' THEN 'Comprovante anexado'
    ELSE 'Status atualizado'
  END;

  v_notification_type := CASE
    WHEN v_status = 'delivered' THEN 'success'
    WHEN v_status = 'failed' THEN 'error'
    WHEN v_status = 'canceled' THEN 'warning'
    ELSE 'info'
  END;
  v_priority := CASE
    WHEN v_status IN ('failed', 'canceled') THEN 'high'
    ELSE 'medium'
  END;
  v_title := v_status_label || ' #' || upper(left(NEW.id::TEXT, 8));

  v_customer_message := CASE v_status
    WHEN 'pending' THEN 'Seu pedido foi recebido pelo estabelecimento.'
    WHEN 'accepted' THEN 'O estabelecimento aceitou seu pedido.'
    WHEN 'preparing' THEN 'Seu pedido esta sendo preparado.'
    WHEN 'ready_for_pickup' THEN 'Seu pedido esta pronto para retirada/coleta.'
    WHEN 'picked_up' THEN 'O motoboy retirou seu pedido e iniciou a entrega.'
    WHEN 'delivered' THEN 'Seu pedido foi marcado como entregue.'
    WHEN 'canceled' THEN 'Seu pedido foi cancelado.'
    WHEN 'failed' THEN 'Houve uma falha operacional na entrega do pedido.'
    ELSE 'Seu pedido foi atualizado.'
  END || ' (' || v_event_label || ').';

  v_merchant_message := CASE v_status
    WHEN 'pending' THEN 'Novo pedido recebido no painel da loja.'
    WHEN 'accepted' THEN 'Pedido aceito pela operacao.'
    WHEN 'preparing' THEN 'Pedido em preparo na operacao.'
    WHEN 'ready_for_pickup' THEN 'Pedido pronto para coleta.'
    WHEN 'picked_up' THEN 'Motoboy retirou o pedido.'
    WHEN 'delivered' THEN 'Pedido entregue ao cliente.'
    WHEN 'canceled' THEN 'Pedido cancelado.'
    WHEN 'failed' THEN 'Falha registrada na entrega do pedido.'
    ELSE 'Pedido atualizado na operacao.'
  END || ' (' || v_event_label || ').';

  v_courier_message := CASE v_status
    WHEN 'accepted' THEN 'Pedido aceito pela loja. Acompanhe a fila de entregas.'
    WHEN 'preparing' THEN 'Pedido em preparo. Prepare-se para a coleta quando for chamado.'
    WHEN 'ready_for_pickup' THEN 'Pedido pronto para coleta.'
    WHEN 'picked_up' THEN 'Entrega em rota. Mantenha o cliente informado.'
    WHEN 'delivered' THEN 'Entrega concluida.'
    WHEN 'canceled' THEN 'Pedido cancelado. Verifique se ha acao pendente.'
    WHEN 'failed' THEN 'Falha de entrega registrada. Revise o incidente no painel.'
    ELSE 'Entrega atualizada.'
  END || ' (' || v_event_label || ').';

  IF NEW.source_type::TEXT = 'gastronomy' THEN
    v_customer_url := '/gastronomia/pedidos/' || NEW.id::TEXT;
    IF NEW.source_id IS NOT NULL THEN
      v_merchant_url := '/central/empresas/' || NEW.source_id ||
        '/gastronomia/pedidos/' || NEW.id::TEXT;
    END IF;
  END IF;

  v_idempotency_key := 'order:' || NEW.id::TEXT || ':' || v_event || ':' || v_status;
  v_metadata := jsonb_strip_nulls(jsonb_build_object(
    'domain', 'orders',
    'event', v_event,
    'event_label', v_event_label,
    'order_id', NEW.id,
    'order_status', v_status,
    'source_type', NEW.source_type,
    'source_id', NEW.source_id,
    'merchant_profile_id', NEW.merchant_profile_id,
    'customer_profile_id', NEW.customer_profile_id,
    'courier_profile_id', NEW.courier_profile_id
  ));

  IF v_customer_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      v_customer_user_id,
      v_event,
      'order',
      NEW.id::TEXT,
      v_notification_type,
      'transactional',
      v_priority,
      v_title,
      v_customer_message,
      v_customer_url,
      CASE WHEN v_customer_url IS NOT NULL THEN 'Abrir pedido' ELSE NULL END,
      v_metadata || jsonb_build_object('audience', 'customer'),
      v_idempotency_key,
      now(),
      5::SMALLINT
    );
  END IF;

  IF v_merchant_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      v_merchant_user_id,
      v_event,
      'order',
      NEW.id::TEXT,
      v_notification_type,
      'transactional',
      v_priority,
      v_title,
      v_merchant_message,
      v_merchant_url,
      CASE WHEN v_merchant_url IS NOT NULL THEN 'Abrir pedido' ELSE NULL END,
      v_metadata || jsonb_build_object('audience', 'merchant'),
      v_idempotency_key,
      now(),
      5::SMALLINT
    );
  END IF;

  IF v_courier_user_id IS NOT NULL AND v_status <> 'pending' THEN
    PERFORM private.enqueue_notification(
      v_courier_user_id,
      v_event,
      'order',
      NEW.id::TEXT,
      v_notification_type,
      'transactional',
      v_priority,
      v_title,
      v_courier_message,
      '/central/motoboy/entregas',
      'Abrir entregas',
      v_metadata || jsonb_build_object('audience', 'courier'),
      v_idempotency_key,
      now(),
      5::SMALLINT
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_order_notifications()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_order_notifications_insert
  ON public.orders;
CREATE TRIGGER trg_enqueue_order_notifications_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_order_notifications();

DROP TRIGGER IF EXISTS trg_enqueue_order_notifications_update
  ON public.orders;
CREATE TRIGGER trg_enqueue_order_notifications_update
  AFTER UPDATE OF logistics_status, proof_of_delivery ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_order_notifications();

-- security-authority: internal-function private.enqueue_business_claim_notification
CREATE OR REPLACE FUNCTION private.enqueue_business_claim_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_business_name TEXT := 'empresa';
  v_approved BOOLEAN;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status
     OR NEW.status NOT IN ('approved', 'aprovada', 'rejected', 'rejeitada') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(btrim(business.name), ''), 'empresa')
  INTO v_business_name
  FROM public.businesses business
  WHERE business.id = NEW.business_id;

  v_business_name := COALESCE(v_business_name, 'empresa');
  v_approved := NEW.status IN ('approved', 'aprovada');

  PERFORM private.enqueue_notification(
    NEW.user_id,
    'business_claim_resolved',
    'business_claim',
    NEW.id::TEXT,
    CASE WHEN v_approved THEN 'success' ELSE 'warning' END,
    'transactional',
    'high',
    CASE
      WHEN v_approved THEN 'Reivindicacao aprovada'
      ELSE 'Reivindicacao rejeitada'
    END,
    CASE
      WHEN v_approved THEN
        'Sua reivindicacao da empresa "' || v_business_name || '" foi aprovada!'
      ELSE
        'Sua reivindicacao da empresa "' || v_business_name || '" foi rejeitada.'
    END,
    CASE WHEN v_approved THEN '/central/empresas' ELSE '/conta' END,
    CASE WHEN v_approved THEN 'Gerenciar empresa' ELSE 'Ver conta' END,
    jsonb_build_object(
      'domain', 'business',
      'event', 'business_claim_resolved',
      'business_claim_id', NEW.id,
      'business_id', NEW.business_id,
      'status', NEW.status
    ),
    'business:claim:' || NEW.id::TEXT || ':' || lower(NEW.status),
    now(),
    5::SMALLINT
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_business_claim_notification()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_business_claim_notification
  ON public.business_claims;
CREATE TRIGGER trg_enqueue_business_claim_notification
  AFTER UPDATE OF status ON public.business_claims
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_business_claim_notification();
