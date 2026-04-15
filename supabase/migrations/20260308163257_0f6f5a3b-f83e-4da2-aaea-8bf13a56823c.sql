-- Reconciliation migration (no-op)
-- -----------------------------------------------------------------------------
-- This migration originally re-created core tables/policies that were already
-- defined by previous migrations (notably 20260201083610_*), which can break
-- clean replays with "relation/policy already exists" errors.
--
-- We keep the file/timestamp for migration history integrity, but make it
-- intentionally idempotent and side-effect free.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE 'No-op reconciliation migration 20260308163257';
END $$;

