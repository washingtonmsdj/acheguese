-- Forward replacement for retired retroactive migration 20261002175500_harden_professional_trust_reputation_search_path.sql.
-- The original version was never recorded in the canonical production ledger.
-- This forward version preserves the intended final schema without retroactive replay.

-- Harden the public professional reputation read model without changing its caller contract.
-- Supabase recommends an explicit search_path for SECURITY DEFINER functions.
-- The function body already schema-qualifies every relation it reads.

ALTER FUNCTION public.get_professional_trust_reputation(uuid)
  SET search_path = '';
