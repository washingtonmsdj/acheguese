-- ============================================================================
-- Admin operations for sponsored ad campaigns
-- ============================================================================
-- The public/business self-service contract lets companies request campaigns,
-- but approval, billing, priority, and activation are platform-controlled.
--
-- This migration keeps that boundary explicit:
-- - admin reads/updates are guarded by RLS and private.is_admin_from_roles.
-- - state mutation goes through a SECURITY INVOKER RPC, so RLS still applies.
-- - active campaigns are impossible unless review and billing are valid.
-- - protected field changes are recorded in an audit table by a private trigger.
-- ============================================================================

ALTER TABLE public.ad_campaigns
  DROP CONSTRAINT IF EXISTS ad_campaigns_active_requires_approval_billing_check;

ALTER TABLE public.ad_campaigns
  ADD CONSTRAINT ad_campaigns_active_requires_approval_billing_check
  CHECK (
    status <> 'active'
    OR (
      review_status = 'approved'
      AND billing_status IN ('authorized', 'paid')
    )
  );

CREATE TABLE IF NOT EXISTS public.ad_campaign_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ad_campaign_admin_actions_action_check
    CHECK (
      action IN (
        'campaign_updated',
        'review_draft',
        'review_pending',
        'review_approved',
        'review_rejected',
        'review_archived',
        'billing_updated',
        'status_updated',
        'priority_updated'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_ad_campaign_admin_actions_campaign_created
  ON public.ad_campaign_admin_actions (campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_campaign_admin_actions_actor_created
  ON public.ad_campaign_admin_actions (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

ALTER TABLE public.ad_campaign_admin_actions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_campaign_admin_actions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ad_campaign_admin_actions TO authenticated;
GRANT ALL ON TABLE public.ad_campaign_admin_actions TO service_role;

DROP POLICY IF EXISTS ad_campaign_admin_actions_admin_select
  ON public.ad_campaign_admin_actions;
DROP POLICY IF EXISTS ad_campaign_admin_actions_service_role_all
  ON public.ad_campaign_admin_actions;

CREATE POLICY ad_campaign_admin_actions_admin_select
  ON public.ad_campaign_admin_actions
  FOR SELECT
  TO authenticated
  USING (coalesce(private.is_admin_from_roles((select auth.uid())), false));

CREATE POLICY ad_campaign_admin_actions_service_role_all
  ON public.ad_campaign_admin_actions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT UPDATE (
  status,
  review_status,
  billing_status,
  priority,
  approved_at,
  approved_by_profile_id,
  rejection_reason,
  updated_at
) ON public.ad_campaigns TO authenticated;

DROP POLICY IF EXISTS ad_campaigns_admin_select ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_admin_update_controlled_state ON public.ad_campaigns;

CREATE POLICY ad_campaigns_admin_select
  ON public.ad_campaigns
  FOR SELECT
  TO authenticated
  USING (coalesce(private.is_admin_from_roles((select auth.uid())), false));

CREATE POLICY ad_campaigns_admin_update_controlled_state
  ON public.ad_campaigns
  FOR UPDATE
  TO authenticated
  USING (coalesce(private.is_admin_from_roles((select auth.uid())), false))
  WITH CHECK (coalesce(private.is_admin_from_roles((select auth.uid())), false));

CREATE OR REPLACE FUNCTION private.audit_ad_campaign_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_actor_user_id UUID := (select auth.uid());
  v_actor_profile_id UUID;
  v_action TEXT := 'campaign_updated';
BEGIN
  IF NOT (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.review_status IS DISTINCT FROM NEW.review_status
    OR OLD.billing_status IS DISTINCT FROM NEW.billing_status
    OR OLD.priority IS DISTINCT FROM NEW.priority
    OR OLD.approved_at IS DISTINCT FROM NEW.approved_at
    OR OLD.approved_by_profile_id IS DISTINCT FROM NEW.approved_by_profile_id
    OR OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason
  ) THEN
    RETURN NEW;
  END IF;

  IF v_actor_user_id IS NOT NULL THEN
    SELECT p.id
      INTO v_actor_profile_id
    FROM public.profiles p
    WHERE p.user_id = v_actor_user_id
      AND p.is_active = true
    ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF OLD.review_status IS DISTINCT FROM NEW.review_status THEN
    v_action := 'review_' || NEW.review_status;
  ELSIF OLD.billing_status IS DISTINCT FROM NEW.billing_status THEN
    v_action := 'billing_updated';
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_action := 'status_updated';
  ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
    v_action := 'priority_updated';
  END IF;

  INSERT INTO public.ad_campaign_admin_actions (
    campaign_id,
    actor_user_id,
    actor_profile_id,
    action,
    previous_state,
    next_state,
    reason,
    metadata
  )
  VALUES (
    NEW.id,
    v_actor_user_id,
    COALESCE(NEW.approved_by_profile_id, v_actor_profile_id),
    v_action,
    jsonb_build_object(
      'status', OLD.status,
      'review_status', OLD.review_status,
      'billing_status', OLD.billing_status,
      'priority', OLD.priority,
      'approved_at', OLD.approved_at,
      'approved_by_profile_id', OLD.approved_by_profile_id,
      'rejection_reason', OLD.rejection_reason
    ),
    jsonb_build_object(
      'status', NEW.status,
      'review_status', NEW.review_status,
      'billing_status', NEW.billing_status,
      'priority', NEW.priority,
      'approved_at', NEW.approved_at,
      'approved_by_profile_id', NEW.approved_by_profile_id,
      'rejection_reason', NEW.rejection_reason
    ),
    NEW.rejection_reason,
    jsonb_build_object(
      'source', NEW.source,
      'placement_key', NEW.placement_key
    )
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.audit_ad_campaign_admin_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_ad_campaign_admin_change ON public.ad_campaigns;
CREATE TRIGGER audit_ad_campaign_admin_change
  AFTER UPDATE ON public.ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_ad_campaign_admin_change();

CREATE OR REPLACE FUNCTION public.admin_update_ad_campaign_state(
  p_campaign_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $function$
DECLARE
  v_admin_user_id UUID := (select auth.uid());
  v_admin_profile_id UUID;
  v_campaign public.ad_campaigns%ROWTYPE;
  v_payload JSONB := coalesce(p_payload, '{}'::jsonb);
  v_review_status TEXT := NULLIF(btrim(coalesce(v_payload->>'review_status', '')), '');
  v_billing_status TEXT := NULLIF(btrim(coalesce(v_payload->>'billing_status', '')), '');
  v_status TEXT := NULLIF(btrim(coalesce(v_payload->>'status', '')), '');
  v_priority INTEGER;
  v_rejection_reason TEXT := NULLIF(btrim(coalesce(v_payload->>'rejection_reason', '')), '');
  v_next_review_status TEXT;
  v_next_billing_status TEXT;
  v_next_status TEXT;
  v_next_priority INTEGER;
  v_next_approved_at TIMESTAMPTZ;
  v_next_approved_by_profile_id UUID;
  v_next_rejection_reason TEXT;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT coalesce(private.is_admin_from_roles(v_admin_user_id), false) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  SELECT p.id
    INTO v_admin_profile_id
  FROM public.profiles p
  WHERE p.user_id = v_admin_user_id
    AND p.is_active = true
  ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
  LIMIT 1;

  SELECT *
    INTO v_campaign
  FROM public.ad_campaigns ac
  WHERE ac.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_review_status IS NOT NULL
     AND v_review_status NOT IN ('pending', 'approved', 'rejected', 'archived') THEN
    RAISE EXCEPTION 'invalid_review_status' USING ERRCODE = '22023';
  END IF;

  IF v_billing_status IS NOT NULL
     AND v_billing_status NOT IN ('unpaid', 'authorized', 'paid', 'refunded', 'failed') THEN
    RAISE EXCEPTION 'invalid_billing_status' USING ERRCODE = '22023';
  END IF;

  IF v_status IS NOT NULL AND v_status NOT IN ('active', 'paused', 'ended') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;

  IF v_payload ? 'priority' THEN
    IF jsonb_typeof(v_payload->'priority') NOT IN ('number', 'string') THEN
      RAISE EXCEPTION 'invalid_priority' USING ERRCODE = '22023';
    END IF;

    v_priority := NULLIF(btrim(coalesce(v_payload->>'priority', '')), '')::INTEGER;

    IF v_priority < 0 OR v_priority > 1000 THEN
      RAISE EXCEPTION 'invalid_priority' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF v_rejection_reason IS NOT NULL AND char_length(v_rejection_reason) > 500 THEN
    RAISE EXCEPTION 'invalid_rejection_reason' USING ERRCODE = '22023';
  END IF;

  v_next_review_status := COALESCE(v_review_status, v_campaign.review_status);
  v_next_billing_status := COALESCE(v_billing_status, v_campaign.billing_status);
  v_next_status := COALESCE(v_status, v_campaign.status);
  v_next_priority := COALESCE(v_priority, v_campaign.priority);
  v_next_approved_at := v_campaign.approved_at;
  v_next_approved_by_profile_id := v_campaign.approved_by_profile_id;
  v_next_rejection_reason := v_campaign.rejection_reason;

  IF v_review_status = 'approved' THEN
    v_next_approved_at := now();
    v_next_approved_by_profile_id := v_admin_profile_id;
    v_next_rejection_reason := NULL;
  ELSIF v_review_status IN ('pending', 'archived') THEN
    v_next_approved_at := NULL;
    v_next_approved_by_profile_id := NULL;
    v_next_rejection_reason := NULL;
  ELSIF v_review_status = 'rejected' THEN
    IF v_rejection_reason IS NULL OR char_length(v_rejection_reason) < 3 THEN
      RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = '22023';
    END IF;

    v_next_approved_at := NULL;
    v_next_approved_by_profile_id := NULL;
    v_next_rejection_reason := v_rejection_reason;
    v_next_status := 'paused';
  END IF;

  IF v_status IS NULL
     AND v_next_status = 'active'
     AND (
       v_next_review_status <> 'approved'
       OR v_next_billing_status NOT IN ('authorized', 'paid')
     ) THEN
    v_next_status := 'paused';
  END IF;

  IF v_status = 'active'
     AND (
       v_next_review_status <> 'approved'
       OR v_next_billing_status NOT IN ('authorized', 'paid')
     ) THEN
    RAISE EXCEPTION 'active_campaign_requires_approval_and_billing'
      USING ERRCODE = '23514';
  END IF;

  IF v_review_status = 'archived' AND v_status IS NULL THEN
    v_next_status := 'ended';
  END IF;

  UPDATE public.ad_campaigns
  SET
    review_status = v_next_review_status,
    billing_status = v_next_billing_status,
    status = v_next_status,
    priority = v_next_priority,
    approved_at = v_next_approved_at,
    approved_by_profile_id = v_next_approved_by_profile_id,
    rejection_reason = v_next_rejection_reason,
    updated_at = now()
  WHERE id = p_campaign_id
  RETURNING * INTO v_campaign;

  RETURN jsonb_build_object(
    'id', v_campaign.id,
    'owner_business_id', v_campaign.owner_business_id,
    'advertiser_name', v_campaign.advertiser_name,
    'advertiser_contact', v_campaign.advertiser_contact,
    'title', v_campaign.title,
    'description', v_campaign.description,
    'image_url', v_campaign.image_url,
    'cta_label', v_campaign.cta_label,
    'cta_url', v_campaign.cta_url,
    'status', v_campaign.status,
    'review_status', v_campaign.review_status,
    'billing_status', v_campaign.billing_status,
    'source', v_campaign.source,
    'placement_key', v_campaign.placement_key,
    'priority', v_campaign.priority,
    'starts_at', v_campaign.starts_at,
    'ends_at', v_campaign.ends_at,
    'budget_total', v_campaign.budget_total,
    'budget_spent', v_campaign.budget_spent,
    'impressions', v_campaign.impressions,
    'clicks', v_campaign.clicks,
    'territory_ref_id', v_campaign.territory_ref_id,
    'territory_type', v_campaign.territory_type,
    'approved_at', v_campaign.approved_at,
    'approved_by_profile_id', v_campaign.approved_by_profile_id,
    'rejection_reason', v_campaign.rejection_reason,
    'created_at', v_campaign.created_at,
    'updated_at', v_campaign.updated_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_ad_campaign_state(UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_ad_campaign_state(UUID, JSONB)
  TO authenticated;

COMMENT ON TABLE public.ad_campaign_admin_actions IS
  'Audit log for platform-controlled sponsored ad review, billing, activation, and priority changes.';

COMMENT ON FUNCTION public.admin_update_ad_campaign_state(UUID, JSONB) IS
  'Admin-only sponsored ad state mutation. SECURITY INVOKER keeps RLS active while validating review, billing, activation, and priority transitions.';

NOTIFY pgrst, 'reload schema';
