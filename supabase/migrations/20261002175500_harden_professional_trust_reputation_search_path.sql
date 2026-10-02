-- Harden the public professional reputation read model without changing its caller contract.
-- Supabase recommends an explicit search_path for SECURITY DEFINER functions.
-- The function body already schema-qualifies every relation it reads.

ALTER FUNCTION public.get_professional_trust_reputation(uuid)
  SET search_path = '';
