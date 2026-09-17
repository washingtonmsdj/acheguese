BEGIN;

-- A consumed quote remains consumed even if the linked ride is later deleted
-- (for example, isolated E2E cleanup or a future retention workflow). The FK
-- intentionally uses ON DELETE SET NULL, so the lifecycle constraint must allow
-- consumed_at to remain as durable audit evidence when consumed_by_ride_id is
-- cleared by the FK.
ALTER TABLE public.mobility_price_quotes
  DROP CONSTRAINT IF EXISTS mobility_price_quotes_lifecycle_contract;

ALTER TABLE public.mobility_price_quotes
  ADD CONSTRAINT mobility_price_quotes_lifecycle_contract CHECK (
    expires_at > issued_at
    AND (
      (consumed_at IS NULL AND consumed_by_ride_id IS NULL)
      OR consumed_at IS NOT NULL
    )
  );

COMMENT ON CONSTRAINT mobility_price_quotes_lifecycle_contract
  ON public.mobility_price_quotes IS
  'Unconsumed quotes have neither consumption field. Consumed quotes keep consumed_at permanently; consumed_by_ride_id may become NULL when the referenced ride is deleted.';

COMMIT;
