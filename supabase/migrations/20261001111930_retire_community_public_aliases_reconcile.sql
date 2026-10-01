-- Retire the obsolete global Community alias namespace.
--
-- Canonical public Community URLs are territory-first:
--   /:state/:city/:territory/comunidade
--
-- There are no users or inbound compatibility contracts to preserve, so the
-- old /:alias and /comunidade/:alias model is removed instead of redirected.

DROP TABLE IF EXISTS public.community_public_aliases;
