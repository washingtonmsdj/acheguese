/**
 * EDGE FUNCTION: gastronomy-upgrade-plan
 *
 * Gerencia upgrade/downgrade de planos do vertical Gastronomia.
 * Integra com Stripe e atualiza banco de dados.
 *
 * Endpoint: /functions/v1/gastronomy-upgrade-plan
 * Method: POST
 * Auth: Required (service_role ou authenticated user com permissão)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface UpgradeRequest {
  businessId: string;
  newPlanTier: 'pro' | 'delivery';
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

interface UpgradeResponse {
  success: boolean;
  subscription?: any;
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_PRICE_ID_PRO = Deno.env.get('STRIPE_PRICE_ID_PRO')!;
const STRIPE_PRICE_ID_DELIVERY = Deno.env.get('STRIPE_PRICE_ID_DELIVERY')!;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

function getPriceId(planTier: 'pro' | 'delivery'): string {
  return planTier === 'pro' ? STRIPE_PRICE_ID_PRO : STRIPE_PRICE_ID_DELIVERY;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// ══════════════════════════════════════════════════════════════════════════
// HANDLER
// ══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }
  
  try {
    // Parse request
    const { businessId, newPlanTier, prorationBehavior }: UpgradeRequest = await req.json();
    
    // Validate input
    if (!businessId || !newPlanTier) {
      return new Response(
        JSON.stringify({ success: false, error: 'businessId e newPlanTier são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    if (!['pro', 'delivery'].includes(newPlanTier)) {
      return new Response(
        JSON.stringify({ success: false, error: 'newPlanTier deve ser "pro" ou "delivery"' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar assinatura atual
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('gastronomy_subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .single();
    
    if (fetchError || !currentSubscription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assinatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se já está no plano desejado
    if (currentSubscription.plan_tier === newPlanTier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Já está no plano desejado' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Se não tem stripe_subscription_id, precisa criar assinatura
    if (!currentSubscription.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Assinatura Stripe não encontrada. Use create-subscription primeiro.' 
        }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Atualizar assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripe_subscription_id
    );
    
    const priceId = getPriceId(newPlanTier);
    
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: prorationBehavior || 'create_prorations',
        metadata: {
          ...stripeSubscription.metadata,
          plan_tier: newPlanTier,
        },
      }
    );
    
    // Atualizar banco de dados
    const { error: updateError } = await supabase
      .from('gastronomy_subscriptions')
      .update({
        plan_tier: newPlanTier,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);
    
    if (updateError) {
      console.error('Erro ao atualizar banco:', updateError);
      // Não falhar a requisição, pois o Stripe já foi atualizado
      // O webhook vai sincronizar depois
    }
    
    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          plan_tier: newPlanTier,
          status: updatedSubscription.status,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        },
      } as UpgradeResponse),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      } as UpgradeResponse),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});
