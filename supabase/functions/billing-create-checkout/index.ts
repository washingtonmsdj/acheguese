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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting map (em produção, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, limit: number = 20): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 }) // 1 minuto
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
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
    // 3. VALIDAR AUTENTICAÇÃO
    // ════════════════════════════════════════════════════════════════════════
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 4. RATE LIMITING
    // ════════════════════════════════════════════════════════════════════════
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 5. VALIDAR INPUT
    // ════════════════════════════════════════════════════════════════════════
    const { planCode, successUrl, cancelUrl } = await req.json()

    if (!planCode || typeof planCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid planCode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing successUrl or cancelUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Plano free não precisa de checkout
    if (plan.code === 'free') {
      return new Response(
        JSON.stringify({ error: 'Free plan does not require checkout' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in billing-create-checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
