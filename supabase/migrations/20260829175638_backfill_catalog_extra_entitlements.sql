-- G4 Billing/Subscriptions SSOT hardening.
-- Preserve only entitlement capabilities that still existed exclusively in the
-- legacy billing_plans JSON, while keeping first-class catalog columns as the
-- stronger authority for capabilities already modeled explicitly.

WITH canonical_base AS (
  SELECT
    cep.id AS entitlement_policy_id,
    bp.entitlements - ARRAY[
      'canUsePremiumPublicPage',
      'canUseShortPremiumLink',
      'canUseCustomQRCode',
      'canUseAdvancedMenu',
      'canReceiveInternalOrders',
      'canUseMotoboyNetwork',
      'canUsePromotions',
      'canUseBasicAnalytics',
      'canUseAdvancedAnalytics',
      'maxMenuItems',
      'maxPromotions',
      'maxImages',
      'maxCategories',
      'maxOrdersPerDay'
    ]::text[] AS extra_entitlements
  FROM public.billing_plans bp
  JOIN public.catalog_item ci
    ON ci.item_code = ('base-' || bp.code)
  JOIN public.commercial_catalog_version ccv
    ON ccv.id = ci.catalog_version_id
   AND ccv.status = 'published'
  JOIN public.catalog_entitlement_policy cep
    ON cep.catalog_item_id = ci.id
  WHERE bp.code IN ('free', 'pro', 'delivery')
)
UPDATE public.catalog_entitlement_policy cep
SET
  additional_entitlements = COALESCE(cep.additional_entitlements, '{}'::jsonb)
    || COALESCE(canonical_base.extra_entitlements, '{}'::jsonb),
  updated_at = now()
FROM canonical_base
WHERE cep.id = canonical_base.entitlement_policy_id;
