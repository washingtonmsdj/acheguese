-- Remove the remaining broad public listing policy on the public-assets bucket.
--
-- The earlier storage hardening migration removed the underscore variant used
-- by local history. The linked remote still had the hyphenated policy name
-- reported by the Supabase security advisor.

DROP POLICY IF EXISTS "public-assets_select_public" ON storage.objects;
