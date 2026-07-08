-- Harden public Storage buckets against object enumeration.
--
-- Public buckets can continue serving known object URLs through Supabase
-- Storage public URL handling. These broad SELECT policies are only needed for
-- object metadata reads/list APIs and were flagged by the remote security
-- advisor as public bucket listing exposure.

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Business images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Classified images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS public_assets_select_public ON storage.objects;
