-- Corrige a temporizacao do trigger canonico de pedidos e recompõe timestamps
-- operacionais que ficaram nulos quando o trigger foi criado como AFTER.

DROP TRIGGER IF EXISTS log_order_timeline_event_trigger ON public.orders;
DROP TRIGGER IF EXISTS log_order_timeline_event_insert_trigger ON public.orders;
DROP TRIGGER IF EXISTS log_order_timeline_event_update_trigger ON public.orders;
CREATE TRIGGER log_order_timeline_event_insert_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_timeline_event();
CREATE TRIGGER log_order_timeline_event_update_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_timeline_event();
WITH status_timestamps AS (
  SELECT
    order_id,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'accepted') AS accepted_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'preparing') AS preparing_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'ready_for_pickup') AS ready_for_pickup_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'picked_up') AS picked_up_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'delivered') AS delivered_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'canceled') AS canceled_at,
    MIN(created_at) FILTER (WHERE to_logistics_status = 'failed') AS failed_at
  FROM public.order_timeline_events
  WHERE event_type = 'logistics_status_changed'
  GROUP BY order_id
)
UPDATE public.orders o
SET
  accepted_at = COALESCE(o.accepted_at, s.accepted_at),
  preparing_at = COALESCE(o.preparing_at, s.preparing_at),
  ready_for_pickup_at = COALESCE(o.ready_for_pickup_at, s.ready_for_pickup_at),
  picked_up_at = COALESCE(o.picked_up_at, s.picked_up_at),
  delivered_at = COALESCE(o.delivered_at, s.delivered_at),
  canceled_at = COALESCE(o.canceled_at, s.canceled_at),
  failed_at = COALESCE(o.failed_at, s.failed_at)
FROM status_timestamps s
WHERE o.id = s.order_id
  AND (
    (o.accepted_at IS NULL AND s.accepted_at IS NOT NULL)
    OR (o.preparing_at IS NULL AND s.preparing_at IS NOT NULL)
    OR (o.ready_for_pickup_at IS NULL AND s.ready_for_pickup_at IS NOT NULL)
    OR (o.picked_up_at IS NULL AND s.picked_up_at IS NOT NULL)
    OR (o.delivered_at IS NULL AND s.delivered_at IS NOT NULL)
    OR (o.canceled_at IS NULL AND s.canceled_at IS NOT NULL)
    OR (o.failed_at IS NULL AND s.failed_at IS NOT NULL)
  );
