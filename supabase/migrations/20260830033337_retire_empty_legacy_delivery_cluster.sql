-- G5 Delivery provenance cleanup.
--
-- Audit on 2026-08-30 confirmed:
--   * delivery_requests, delivery_status_history and delivery_tracking: 0 rows;
--   * no HEAD runtime caller for the three legacy tables;
--   * canonical motoboy flow is public.ride_requests;
--   * no incoming FK from outside this three-table cluster;
--   * remaining SQL references are legacy helper RPCs/policies/triggers internal
--     to this cluster;
--   * helper RPCs had already been restricted to service_role.
--
-- CASCADE is intentionally forbidden. Unexpected dependencies must fail closed.

DROP FUNCTION IF EXISTS public.get_available_deliveries(
  numeric,
  numeric,
  numeric
);
DROP FUNCTION IF EXISTS public.get_delivery_stats(
  uuid,
  timestamptz,
  timestamptz
);
DROP FUNCTION IF EXISTS public.get_next_delivery_request_number(uuid);

DROP TABLE IF EXISTS public.delivery_tracking RESTRICT;
DROP TABLE IF EXISTS public.delivery_status_history RESTRICT;
DROP TABLE IF EXISTS public.delivery_requests RESTRICT;

-- log_delivery_status_change was owned only by the trigger on delivery_requests.
-- Drop it after the table so the trigger dependency disappears naturally.
DROP FUNCTION IF EXISTS public.log_delivery_status_change();
