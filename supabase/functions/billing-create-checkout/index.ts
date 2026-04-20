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
import { validateBody, createCheckoutSchema, validationErrorResponse, type CreateCheckoutBody } from '../_shared/validation.ts'
import { getAllSecurityHeaders, errorResponse, rateLimitMiddleware } from '../_shared/security.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') })
  }

  // Rate limiting via SSOT — 20 req/min por IP
  const rl = await rateLimitMiddleware(req, 20, 60000)
  if (rl) return rl

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: getAllSecurityHeaders() }
      )
    }

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

    const rawBody = await req.json()
    const validation = validateBody<CreateCheckoutBody>(rawBody, createCheckoutSchema)
    if (!validation.ok) {
      return validationErrorResponse(validation.errors)
    }
    const { planCode, successUrl, cancelUrl } = validation.data!

    // ════════════════════════════════════════════════════════════════════════
    // 6. EXECUTAR OPERAÇÃO
    // ════════════════════════════════════════════════════════════════════════
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from('billing_plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return errorResponse('Plan not found', 404)
    }

    // Plano free não precisa de checkout
    if (plan.code === 'free') {
      return errorResponse('Free plan does not require checkout', 400)
    }

    // Buscar ou criar customer no Stripe
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id, // Deve estar configurado no billing_plans
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan_code: planCode,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_code: planCode,
        },
      },
    })

    // ════════════════════════════════════════════════════════════════════════
    // 7. AUDIT LOG
    // ════════════════════════════════════════════════════════════════════════
    await supabaseAdmin.rpc('log_billing_action', {
      p_user_id: user.id,
      p_action: 'checkout_created',
      p_entity_type: 'subscription',
      p_entity_id: null,
      p_old_data: null,
      p_new_data: {
        plan_code: planCode,
        session_id: session.id,
        customer_id: customerId,
      },
      p_metadata: {
        function: 'billing-create-checkout',
        ip: req.headers.get('x-forwarded-for'),
      },
    })

    // ════════════════════════════════════════════════════════════════════════
    // 8. RETORNAR SUCESSO
    // ════════════════════════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: getAllSecurityHeaders() }
    )
  } catch (error) {
    console.error('Error in billing-create-checkout:', error)
    return errorResponse('Internal server error', 500, error)
  }
})

