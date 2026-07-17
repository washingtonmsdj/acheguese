-- Add the missing provider persona before the trust command consolidation.
-- Keeping this in its own migration makes the enum value safe to use from the
-- following transaction on every supported PostgreSQL version.

ALTER TYPE public.trust_actor_role
  ADD VALUE IF NOT EXISTS 'professional';
