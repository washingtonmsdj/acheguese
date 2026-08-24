// ══════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: billing-create-checkout
// ══════════════════════════════════════════════════════════════════════════
//
// Cria uma sessão de checkout do Stripe para o usuário assinar um plano.
//
// Rate Limit: 20 requisições por minuto por usuário
// Auth: Requer autenticação
//
// ══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { requireOperationalAccount } from '../_shared/accountOperational.ts'
import { validateBody, createCheckoutSchema, validationErrorResponse, type CreateCheckoutBody } from '../_shared/validation.ts'
import {
  errorResponse,
  getAllSecurityHeaders,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts'

const ALLOWED_METHODS = 'POST, OPTIONS'

type CatalogPricingPolicy = {
  price_cents: number
  currency: string | null
  billing_period: string | null
  stripe_price_id: string | null
  stripe_lookup_key: string | null
}

type CatalogItem = {
  id: string
  catalog_version_id: string
  item_code: string
  item_name: string
  pricing_model: string
  entity_family: string | null
  vertical: string | null
  catalog_pricing_policy: CatalogPricingPolicy[] | CatalogPricingPolicy | null
}

function normalizePlanCode(planCode: string): string {
  const trimmed = planCode.trim().toLowerCase()
  if (trimmed === 'base-free') return 'free'
  if (trimmed === 'base-pro') return 'pro'
  if (trimmed === 'base-delivery') return 'delivery'
  return trimmed
}

function toCatalogItemCode(planCode: string): string {
  const normalized = normalizePlanCode(planCode)
  if (normalized === 'free' || normalized === 'pro' || normalized === 'delivery') {
    return `base-${normalized}`
  }
  return normalized
}

function getPricingPolicy(catalogItem: CatalogItem): CatalogPricingPolicy | null {
  const policy = catalogItem.catalog_pricing_policy
  if (Array.isArray(policy)) return policy[0] ?? null
  return policy ?? null
}

async function resolveStripePriceId(
  stripe: Stripe,
  pricing: CatalogPricingPolicy,
): Promise<string | null> {
  if (pricing.stripe_price_id) return pricing.stripe_price_id
  if (!pricing.stripe_lookup_key) return null

  const prices = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [pricing.stripe_lookup_key],
  })

  return prices.data[0]?.id ?? null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) })
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS)
  if (methodError) return methodError

  // Rate limiting via SSOT — 20 req/min por IP
  const rl = await rateLimitMiddleware(req, 20, 60000)
  if (rl) return rl

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return errorResponse('Invalid token', 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const accountOperationalError = await requireOperationalAccount(
      supabaseAdmin,
      user.id,
      req,
      ALLOWED_METHODS,
    )
    if (accountOperationalError) return accountOperationalError

    const rawBody = await readJsonBody<CreateCheckoutBody>(req, {
      maxBytes: 8192,
      methods: ALLOWED_METHODS,
    })
    if (!rawBody.ok) return rawBody.response

    const validation = validateBody<CreateCheckoutBody>(rawBody.data, createCheckoutSchema)
    if (!validation.ok) {
      return validationErrorResponse(validation.errors, ALLOWED_METHODS, req)
    }
    const {
      planCode,
      successUrl,
      cancelUrl,
      businessId,
      subscriptionScope,
      entityFamily,
      vertical,
    } = validation.data!
    const normalizedPlanCode = normalizePlanCode(planCode)
    const catalogItemCode = toCatalogItemCode(normalizedPlanCode)
    const resolvedScope = businessId ? 'business' : (subscriptionScope ?? 'user')

    if ((businessId && resolvedScope !== 'business') || (!businessId && resolvedScope === 'business')) {
      return errorResponse('Business checkout requires business_id and business subscription scope', 400)
    }

    if (businessId) {
      const { data: businessAccess, error: businessAccessError } = await supabaseAdmin
        .from('business_data')
        .select('id, profiles!inner(user_id)')
        .eq('id', businessId)
        .eq('profiles.user_id', user.id)
        .maybeSingle()

      if (businessAccessError || !businessAccess) {
        return errorResponse('Business not found or access denied', 403, businessAccessError)
      }
    }

    const { data: catalogItem, error: catalogError } = await supabaseAdmin
      .from('catalog_item')
      .select(`
        id,
        catalog_version_id,
        item_code,
        item_name,
        pricing_model,
        entity_family,
        vertical,
        commercial_catalog_version!inner(status),
        catalog_pricing_policy (
          price_cents,
          currency,
          billing_period,
          stripe_price_id,
          stripe_lookup_key
        )
      `)
      .eq('item_code', catalogItemCode)
      .eq('commercial_catalog_version.status', 'published')
      .maybeSingle()

    if (catalogError || !catalogItem) {
      return errorResponse('Plan not found', 404)
    }

    const pricing = getPricingPolicy(catalogItem as CatalogItem)

    if (!pricing) {
      return errorResponse('Plan pricing is not configured', 500)
    }

    if (catalogItem.pricing_model === 'free' || normalizedPlanCode === 'free') {
      return errorResponse('Free plan does not require checkout', 400)
    }

    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const stripePriceId = await resolveStripePriceId(stripe, pricing)

    if (!stripePriceId) {
      return errorResponse('Plan is not configured for Stripe checkout', 500)
    }

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    const stripeMetadata: Record<string, string> = {
      supabase_user_id: user.id,
      plan_code: normalizedPlanCode,
      catalog_item_code: catalogItem.item_code,
      catalog_version_id: catalogItem.catalog_version_id,
      subscription_scope: resolvedScope,
    }

    if (businessId) stripeMetadata.business_id = businessId
    if (entityFamily || catalogItem.entity_family) {
      stripeMetadata.entity_family = entityFamily ?? catalogItem.entity_family!
    }
    if (vertical || catalogItem.vertical) {
      stripeMetadata.vertical = vertical ?? catalogItem.vertical!
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: stripeMetadata,
      subscription_data: {
        metadata: stripeMetadata,
      },
    })

    await supabaseAdmin.rpc('log_billing_action', {
      p_user_id: user.id,
      p_action: 'checkout_created',
      p_entity_type: 'subscription',
      p_entity_id: null,
      p_old_data: null,
      p_new_data: {
        plan_code: normalizedPlanCode,
        catalog_item_code: catalogItem.item_code,
        business_id: businessId ?? null,
        session_id: session.id,
        customer_id: customerId,
      },
      p_metadata: {
        function: 'billing-create-checkout',
        ip: req.headers.get('x-forwarded-for'),
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) }
    )
  } catch (error) {
    console.error('Error in billing-create-checkout:', error)
    return errorResponse('Internal server error', 500, error)
  }
})
