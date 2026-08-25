-- Remove legacy permissive public ad policies that weaken the hardened
-- self-service advertising contract.
--
-- PostgreSQL combines permissive policies with OR. The legacy policies below
-- allowed public reads based only on active/time-window state, bypassing the
-- canonical review_status='approved' and billing_status in ('authorized','paid')
-- requirements enforced by ad_*_public_active_approved_select.

DROP POLICY IF EXISTS public_read_active_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS public_read_active_campaign_targets ON public.ad_targets;
