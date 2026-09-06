-- G6 Business/Profile SSOT for self-service advertisement RLS.
-- Profile membership role interpretation must live in private.can_manage_profile,
-- reached here through private.can_operate_business_profile.

DROP POLICY IF EXISTS ad_campaigns_owner_select ON public.ad_campaigns;
CREATE POLICY ad_campaigns_owner_select
ON public.ad_campaigns
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_campaigns_owner_insert ON public.ad_campaigns;
CREATE POLICY ad_campaigns_owner_insert
ON public.ad_campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  owner_business_id IS NOT NULL
  AND status = 'paused'
  AND review_status IN ('draft', 'pending')
  AND billing_status = 'unpaid'
  AND source = 'self_service'
  AND priority = 0
  AND approved_at IS NULL
  AND approved_by_profile_id IS NULL
  AND created_by_profile_id = (
    SELECT bd.profile_id
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_campaigns_owner_update_unapproved ON public.ad_campaigns;
CREATE POLICY ad_campaigns_owner_update_unapproved
ON public.ad_campaigns
FOR UPDATE
TO authenticated
USING (
  source = 'self_service'
  AND review_status IN ('draft', 'pending', 'rejected')
  AND EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
      AND private.can_operate_business_profile(bd.profile_id)
  )
)
WITH CHECK (
  owner_business_id IS NOT NULL
  AND status = 'paused'
  AND review_status IN ('draft', 'pending')
  AND billing_status = 'unpaid'
  AND source = 'self_service'
  AND priority = 0
  AND approved_at IS NULL
  AND approved_by_profile_id IS NULL
  AND created_by_profile_id = (
    SELECT bd.profile_id
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.id = ad_campaigns.owner_business_id
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_targets_owner_select ON public.ad_targets;
CREATE POLICY ad_targets_owner_select
ON public.ad_targets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ad_campaigns ac
    JOIN public.business_data bd ON bd.id = ac.owner_business_id
    WHERE ac.id = ad_targets.campaign_id
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_targets_owner_insert ON public.ad_targets;
CREATE POLICY ad_targets_owner_insert
ON public.ad_targets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.ad_campaigns ac
    JOIN public.business_data bd ON bd.id = ac.owner_business_id
    WHERE ac.id = ad_targets.campaign_id
      AND ac.source = 'self_service'
      AND ac.status = 'paused'
      AND ac.review_status IN ('draft', 'pending')
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_targets_owner_update ON public.ad_targets;
CREATE POLICY ad_targets_owner_update
ON public.ad_targets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ad_campaigns ac
    JOIN public.business_data bd ON bd.id = ac.owner_business_id
    WHERE ac.id = ad_targets.campaign_id
      AND ac.source = 'self_service'
      AND ac.status = 'paused'
      AND ac.review_status IN ('draft', 'pending', 'rejected')
      AND private.can_operate_business_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.ad_campaigns ac
    JOIN public.business_data bd ON bd.id = ac.owner_business_id
    WHERE ac.id = ad_targets.campaign_id
      AND ac.source = 'self_service'
      AND ac.status = 'paused'
      AND ac.review_status IN ('draft', 'pending')
      AND private.can_operate_business_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS ad_targets_owner_delete ON public.ad_targets;
CREATE POLICY ad_targets_owner_delete
ON public.ad_targets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ad_campaigns ac
    JOIN public.business_data bd ON bd.id = ac.owner_business_id
    WHERE ac.id = ad_targets.campaign_id
      AND ac.source = 'self_service'
      AND ac.status = 'paused'
      AND ac.review_status IN ('draft', 'pending', 'rejected')
      AND private.can_operate_business_profile(bd.profile_id)
  )
);
