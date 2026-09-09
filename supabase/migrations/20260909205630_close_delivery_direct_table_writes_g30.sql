-- G30: reconcile the delivery aggregate with the broker-owned write contract.
--
-- Runtime mutations already go through delivery-rpc -> service-role-only RPCs.
-- Historical table grants/policies still allowed authenticated browser DML.
-- Preserve participant/admin reads while closing generic table writes.

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.orders
  FROM authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.order_items
  FROM authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.delivery_occurrences
  FROM authenticated;

DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS orders_update ON public.orders;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
DROP POLICY IF EXISTS delivery_occurrences_insert ON public.delivery_occurrences;
DROP POLICY IF EXISTS delivery_occurrences_update ON public.delivery_occurrences;

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
CREATE POLICY "Admins can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

COMMENT ON TABLE public.orders IS
  'Canonical order aggregate. Browser clients are read-only; mutations are owned by delivery-rpc and service-role-only delivery commands.';
COMMENT ON TABLE public.order_items IS
  'Canonical order item aggregate. Browser clients are read-only; item creation is owned by the delivery order command.';
COMMENT ON TABLE public.delivery_occurrences IS
  'Canonical delivery occurrence aggregate. Browser clients are read-only; report/resolve writes are owned by delivery-rpc commands.';
