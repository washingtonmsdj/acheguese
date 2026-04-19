// ══════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: billing-create-portal
// ══════════════════════════════════════════════════════════════════════════
//
// Cria uma sessão do Stripe Customer Portal para o usuário gerenciar
// sua assinatura, métodos de pagamento e faturas.
//
// Rate Limit: 30 requisições por minuto por usuário
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

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, limit: number = 30): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 })
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
    const { returnUrl } = await req.json()

    if (!returnUrl || typeof returnUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid returnUrl' }),
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

    // Buscar customer ID do usuário
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar sessão do portal
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    })

    // ════════════════════════════════════════════════════════════════════════
    // 7. AUDIT LOG
    // ════════════════════════════════════════════════════════════════════════
    await supabaseAdmin.rpc('log_billing_action', {
      p_user_id: user.id,
      p_action: 'portal_accessed',
      p_entity_type: 'subscription',
      p_entity_id: null,
      p_old_data: null,
      p_new_data: {
        session_id: session.id,
        customer_id: subscription.stripe_customer_id,
      },
      p_metadata: {
        function: 'billing-create-portal',
        ip: req.headers.get('x-forwarded-for'),
      },
    })

    // ════════════════════════════════════════════════════════════════════════
    // 8. RETORNAR SUCESSO
    // ════════════════════════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in billing-create-portal:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
