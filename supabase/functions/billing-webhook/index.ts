// ══════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: billing-webhook
// ══════════════════════════════════════════════════════════════════════════
//
// Processa webhooks do Stripe para sincronizar assinaturas e pagamentos.
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
// ══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // ════════════════════════════════════════════════════════════════════════
  // 1. CORS
  // ════════════════════════════════════════════════════════════════════════
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // 2. VALIDAR MÉTODO
    // ════════════════════════════════════════════════════════════════════════
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 3. VALIDAR ASSINATURA DO STRIPE
    // ════════════════════════════════════════════════════════════════════════
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      // Marcar webhook como erro
      await supabaseAdmin.rpc('mark_webhook_processed', {
        p_event_id: webhookId,
        p_success: false,
        p_error_message: error.message,
      })

      throw error
    }
  } catch (error) {
    console.error('Error in billing-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ══════════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════════

async function handleSubscriptionChange(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  const userId = subscription.metadata.supabase_user_id
  const planCode = subscription.metadata.plan_code

  if (!userId || !planCode) {
    console.error('Missing metadata in subscription:', subscription.id)
    return
  }

  // Buscar price_id para obter o plano correto
  const priceId = subscription.items.data[0]?.price.id

  // Upsert subscription
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_code: planCode,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: priceId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userId,
    p_business_id: null,
    p_subscription_id: null,
    p_transaction_type: event.type === 'customer.subscription.created' ? 'subscription_created' : 'subscription_updated',
    p_amount_cents: null,
    p_currency: 'BRL',
    p_stripe_invoice_id: null,
    p_stripe_payment_intent_id: null,
    p_status: 'succeeded',
    p_metadata: {
      subscription_id: subscription.id,
      plan_code: planCode,
      status: subscription.status,
    },
  })
}

async function handleSubscriptionDeleted(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  const userId = subscription.metadata.supabase_user_id

  if (!userId) {
    console.error('Missing user_id in subscription:', subscription.id)
    return
  }

  // Atualizar para plano free
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan_code: 'free',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating subscription to free:', error)
    throw error
  }

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userId,
    p_business_id: null,
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

async function handleInvoicePaid(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  const subscription = invoice.subscription as string
  const customerId = invoice.customer as string

  // Buscar usuário pelo customer_id
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSub) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userSub.user_id,
    p_business_id: null,
    p_subscription_id: null,
    p_transaction_type: 'payment_succeeded',
    p_amount_cents: invoice.amount_paid,
    p_currency: invoice.currency.toUpperCase(),
    p_stripe_invoice_id: invoice.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_status: 'succeeded',
    p_metadata: {
      subscription_id: subscription,
      invoice_number: invoice.number,
    },
  })
}

async function handleInvoicePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  const subscription = invoice.subscription as string
  const customerId = invoice.customer as string

  // Buscar usuário pelo customer_id
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSub) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Atualizar status para past_due
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userSub.user_id)

  // Log transaction
  await supabase.rpc('log_billing_transaction', {
    p_user_id: userSub.user_id,
    p_business_id: null,
    p_subscription_id: null,
    p_transaction_type: 'payment_failed',
    p_amount_cents: invoice.amount_due,
    p_currency: invoice.currency.toUpperCase(),
    p_stripe_invoice_id: invoice.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_status: 'failed',
    p_metadata: {
      subscription_id: subscription,
      invoice_number: invoice.number,
      attempt_count: invoice.attempt_count,
    },
  })
}
