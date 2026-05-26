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
import { validateBody, createPortalSchema, validationErrorResponse, type CreatePortalBody } from '../_shared/validation.ts'
import { getAllSecurityHeaders, errorResponse, rateLimitMiddleware } from '../_shared/security.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') })
  }

  // Rate limiting via SSOT — 30 req/min por IP
  const rl = await rateLimitMiddleware(req, 30, 60000)
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
    const validation = validateBody<CreatePortalBody>(rawBody, createPortalSchema)
    if (!validation.ok) {
      return validationErrorResponse(validation.errors)
    }
    const { returnUrl } = validation.data!

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
      .not('stripe_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !subscription?.stripe_customer_id) {
      return errorResponse('No active subscription found', 404)
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

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: getAllSecurityHeaders() }
    )
  } catch (error) {
    console.error('Error in billing-create-portal:', error)
    return errorResponse('Internal server error', 500, error)
  }
})

