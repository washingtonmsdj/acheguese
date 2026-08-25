-- Remove the permissive SELECT policy that shadows verified-only public reads.
-- Owners keep access to their own rows through "Users manage own addresses".
-- Anonymous/authenticated public discovery remains limited to verified addresses
-- through "Addresses public verified read".

DROP POLICY IF EXISTS "Addresses viewable by all" ON public.addresses;
