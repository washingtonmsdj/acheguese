// ══════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: billing-webhook (SSOT-Compliant)
// ══════════════════════════════════════════════════════════════════════════
//
// Processa webhooks do Stripe para sincronizar assinaturas e pagamentos.
// SSOT: Única fonte de verdade para ingestão de eventos Stripe.
//
// Eventos processados:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.paid
// - invoice.payment_failed
//
// Auth: Validação de assinatura do Stripe
//
// FASE: 4 - Webhooks e Billing Runtime
// REFERÊNCIA: F4_WEBHOOKS_CONSOLIDATION.md
//
// REGRAS SSOT:
// - Idempotência obrigatória via event_id
// - Snapshot imutável de contrato na contratação
// - Status v2 alinhado com Stripe
// - Suporte a multi-vertical (user_id + business_id)
// - Logging estruturado para auditoria
//
// ══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { getAllSecurityHeaders, errorResponse, auditLog, getAuditInfo } from '../_shared/security.ts'

serve(async (req: Request) => {
  // ════════════════════════════════════════════════════════════════════════
  // 1. CORS — Webhooks do Stripe não enviam Origin, mas preflight pode ocorrer
  // ════════════════════════════════════════════════════════════════════════
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') })
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // 2. VALIDAR MÉTODO
    // ════════════════════════════════════════════════════════════════════════
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: getAllSecurityHeaders() }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 3. VALIDAR ASSINATURA DO STRIPE
    // ════════════════════════════════════════════════════════════════════════
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return errorResponse('Missing stripe-signature header', 401)
    }

    const body = await req.text()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage)
      return errorResponse('Invalid signature', 401)
    }

    // ════════════════════════════════════════════════════════════════════════
    // 4. REGISTRAR WEBHOOK
    // ════════════════════════════════════════════════════════════════════════
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: webhookId } = await supabaseAdmin.rpc('register_stripe_webhook_event', {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_event_data: event.data,
    })

    // Se webhook já foi processado (idempotência), retornar sucesso
    if (!webhookId) {
      return new Response(
        JSON.stringify({ received: true, message: 'Event already processed' }),
        { status: 200, headers: getAllSecurityHeaders() }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 5. PROCESSAR EVENTO
    // ════════════════════════════════════════════════════════════════════════
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event, supabaseAdmin)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event, supabaseAdmin)
          break

        case 'invoice.paid':
          await handleInvoicePaid(event, supabaseAdmin)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event, supabaseAdmin)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Marcar webhook como processado
      await supabaseAdmin.rpc('mark_webhook_processed', {
        p_event_id: webhookId,
        p_success: true,
        p_error_message: null,
      })

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: getAllSecurityHeaders() }
      )
    } catch (error) {
      // Marcar webhook como erro
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await supabaseAdmin.rpc('mark_webhook_processed', {
        p_event_id: webhookId,
        p_success: false,
        p_error_message: errorMessage,
      })

      throw error
    }
  } catch (error) {
    console.error('Error in billing-webhook:', error)
    return errorResponse('Internal server error', 500, error)
  }
})

// ══════════════════════════════════════════════════════════════════════════
// HANDLERS (SSOT-Compliant)
// ══════════════════════════════════════════════════════════════════════════

function normalizePlanCode(planCode: string): string {
  const trimmed = planCode.trim().toLowerCase()
  if (trimmed === 'base-free') return 'free'
  if (trimmed === 'base-pro') return 'pro'
  if (trimmed === 'base-delivery') return 'delivery'
  return trimmed
}

function toCatalogItemCode(planCode: string, metadataCode?: string): string {
  if (metadataCode) return metadataCode

  const normalized = normalizePlanCode(planCode)
  if (normalized === 'free' || normalized === 'pro' || normalized === 'delivery') {
    return `base-${normalized}`
  }

  return normalized
}

/**
 * Handle subscription created/updated
 * 
 * SSOT Rules:
 * - Create snapshot of catalog at contract time
 * - Use status_v2 aligned with Stripe
 * - Support business_id (scope = 'business')
 * - Fetch catalog item by plan_code
 */
async function handleSubscriptionChange(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  const userId = subscription.metadata.supabase_user_id
  const businessId = subscription.metadata.business_id
  const rawPlanCode = subscription.metadata.plan_code
  const subscriptionScope = subscription.metadata.subscription_scope || (businessId ? 'business' : 'user')
  const metadataEntityFamily = subscription.metadata.entity_family
  const metadataVertical = subscription.metadata.vertical

  if (!userId || !rawPlanCode) {
    console.error('[billing-webhook] Missing metadata in subscription:', subscription.id)
    return
  }

  const planCode = normalizePlanCode(rawPlanCode)
  const catalogItemCode = toCatalogItemCode(planCode, subscription.metadata.catalog_item_code)

  console.log(`[billing-webhook] Processing ${event.type} for user ${userId}, plan ${planCode}`)

  // Fetch catalog item by plan_code
  const { data: catalogItem, error: catalogError } = await supabase
    .from('catalog_item')
    .select(`
      id,
      catalog_version_id,
      item_code,
      item_name,
      item_type,
      plan_tier,
      entity_family,
      vertical,
      pricing_model,
      catalog_entitlement_policy (
        can_use_premium_public_page,
        can_use_short_premium_link,
        can_use_custom_qr_code,
        can_use_advanced_menu,
        can_receive_internal_orders,
        can_use_motoboy_network,
        can_use_promotions,
        can_use_basic_analytics,
        can_use_advanced_analytics,
        max_menu_items,
        max_promotions,
        max_images,
        max_categories
      ),
      catalog_pricing_policy (
        price_cents,
        currency,
        billing_period,
        stripe_price_id
      ),
      commercial_catalog_version!inner(status)
    `)
    .eq('item_code', catalogItemCode)
    .eq('commercial_catalog_version.status', 'published')
    .maybeSingle()

  if (catalogError || !catalogItem) {
    console.error('[billing-webhook] Catalog item not found:', catalogItemCode, catalogError)
    throw new Error(`Catalog item not found: ${catalogItemCode}`)
  }

  // Create contract snapshot (immutable)
  const contractSnapshot = {
    catalog_item: catalogItem,
    contracted_at: new Date().toISOString(),
    terms_version: '1.0.0',
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id,
  }

  // Map Stripe status to status_v2
  const statusV2 = mapStripeStatus(subscription.status)

  // Get price from subscription
  const priceId = subscription.items.data[0]?.price.id
  const priceCents = subscription.items.data[0]?.price.unit_amount || 0

  const subscriptionPayload = {
    user_id: userId,
    business_id: businessId || null,
    plan_code: planCode,
    plan_type: planCode,
    subscription_scope: subscriptionScope,
    entity_family: metadataEntityFamily || catalogItem.entity_family || null,
    vertical: metadataVertical || catalogItem.vertical || null,
    status: statusV2,
    status_v2: statusV2,
    amount_cents: priceCents,
    price_cents: priceCents,
    billing_period: subscription.items.data[0]?.price.recurring?.interval || 'month',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: priceId,
    catalog_version_id: catalogItem.catalog_version_id,
    contract_snapshot: contractSnapshot,
    active: statusV2 === 'active' || statusV2 === 'trialing',
    updated_at: new Date().toISOString(),
  }

  const { data: existingSubscription, error: lookupError } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (lookupError) {
    console.error('[billing-webhook] Error looking up subscription:', lookupError)
    throw lookupError
  }

  const { error } = existingSubscription
    ? await supabase
        .from('user_subscriptions')
        .update(subscriptionPayload)
        .eq('id', existingSubscription.id)
    : await supabase
        .from('user_subscriptions')
        .insert(subscriptionPayload)

  if (error) {
    console.error('[billing-webhook] Error upserting subscription:', error)
    throw error
  }

  console.log(`[billing-webhook] Subscription ${subscription.id} processed successfully`)

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userId,
    p_business_id: businessId || null,
    p_subscription_id: null,
    p_transaction_type: event.type === 'customer.subscription.created' ? 'subscription_created' : 'subscription_updated',
    p_amount_cents: priceCents,
    p_currency: 'BRL',
    p_stripe_invoice_id: null,
    p_stripe_payment_intent_id: null,
    p_status: 'succeeded',
    p_metadata: {
      subscription_id: subscription.id,
      plan_code: planCode,
      status_v2: statusV2,
      has_snapshot: !!contractSnapshot,
    },
  })
}

/**
 * Handle subscription deleted
 * 
 * SSOT Rules:
 * - Update status_v2 to 'canceled'
 * - Keep snapshot immutable (don't delete)
 * - Don't downgrade to free (keep history)
 */
async function handleSubscriptionDeleted(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  const userId = subscription.metadata.supabase_user_id

  if (!userId) {
    console.error('[billing-webhook] Missing user_id in subscription:', subscription.id)
    return
  }

  console.log(`[billing-webhook] Processing subscription.deleted for user ${userId}`)

  // Update status to canceled (keep snapshot)
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status_v2: 'canceled',
      active: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[billing-webhook] Error updating subscription to canceled:', error)
    throw error
  }

  console.log(`[billing-webhook] Subscription ${subscription.id} canceled successfully`)

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userId,
    p_business_id: subscription.metadata.business_id || null,
    p_subscription_id: null,
    p_transaction_type: 'subscription_canceled',
    p_amount_cents: null,
    p_currency: 'BRL',
    p_stripe_invoice_id: null,
    p_stripe_payment_intent_id: null,
    p_status: 'succeeded',
    p_metadata: {
      subscription_id: subscription.id,
    },
  })
}

/**
 * Handle invoice paid
 * 
 * SSOT Rules:
 * - Update status_v2 to 'active'
 * - Register transaction in ledger
 */
async function handleInvoicePaid(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id
  const customerId = invoice.customer as string

  console.log(`[billing-webhook] Processing invoice.paid for customer ${customerId}`)

  if (!subscriptionId) {
    console.error('[billing-webhook] Missing subscription id for paid invoice:', invoice.id)
    return
  }

  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id, business_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!userSub) {
    console.error('[billing-webhook] Subscription not found for invoice:', subscriptionId)
    return
  }

  // Update status to active
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status_v2: 'active',
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (updateError) {
    console.error('[billing-webhook] Error activating subscription:', updateError)
    throw updateError
  }

  console.log(`[billing-webhook] Invoice ${invoice.id} paid, subscription activated`)

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userSub.user_id,
    p_business_id: userSub.business_id || null,
    p_subscription_id: null,
    p_transaction_type: 'payment_succeeded',
    p_amount_cents: invoice.amount_paid,
    p_currency: invoice.currency.toUpperCase(),
    p_stripe_invoice_id: invoice.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_status: 'succeeded',
    p_metadata: {
      subscription_id: subscriptionId,
      invoice_number: invoice.number,
    },
  })
}

/**
 * Handle invoice payment failed
 * 
 * SSOT Rules:
 * - Update status_v2 to 'past_due'
 * - Register failed attempt in ledger
 */
async function handleInvoicePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id
  const customerId = invoice.customer as string

  console.log(`[billing-webhook] Processing invoice.payment_failed for customer ${customerId}`)

  if (!subscriptionId) {
    console.error('[billing-webhook] Missing subscription id for failed invoice:', invoice.id)
    return
  }

  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id, business_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!userSub) {
    console.error('[billing-webhook] Subscription not found for invoice:', subscriptionId)
    return
  }

  // Atualizar status para past_due
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status_v2: 'past_due',
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (updateError) {
    console.error('[billing-webhook] Error marking subscription as past_due:', updateError)
    throw updateError
  }

  console.log(`[billing-webhook] Invoice ${invoice.id} payment failed, subscription marked as past_due`)

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userSub.user_id,
    p_business_id: userSub.business_id || null,
    p_subscription_id: null,
    p_transaction_type: 'payment_failed',
    p_amount_cents: invoice.amount_due,
    p_currency: invoice.currency.toUpperCase(),
    p_stripe_invoice_id: invoice.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_status: 'failed',
    p_metadata: {
      subscription_id: subscriptionId,
      invoice_number: invoice.number,
      attempt_count: invoice.attempt_count,
    },
  })
}

/**
 * Map Stripe status to status_v2
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'incomplete': 'incomplete',
    'incomplete_expired': 'incomplete_expired',
    'unpaid': 'unpaid',
    'canceled': 'canceled',
  }
  
  return statusMap[stripeStatus] || 'canceled'
}

