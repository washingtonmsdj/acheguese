/**
 * EDGE FUNCTION: gastronomy-reactivate-subscription
 *
 * Reativa uma assinatura que foi marcada para cancelamento.
 * Remove o flag cancel_at_period_end.
 *
 * Endpoint: /functions/v1/gastronomy-reactivate-subscription
 * Method: POST
 * Auth: Required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface ReactivateRequest {
  businessId: string;
}

interface ReactivateResponse {
  success: boolean;
  subscription?: any;
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

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
    const { businessId }: ReactivateRequest = await req.json();
    
    // Validate input
    if (!businessId) {
      return new Response(
        JSON.stringify({ success: false, error: 'businessId é obrigatório' }),
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
    
    // Verificar se está marcada para cancelamento
    if (!currentSubscription.cancel_at_period_end) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assinatura não está marcada para cancelamento' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se tem stripe_subscription_id
    if (!currentSubscription.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Assinatura Stripe não encontrada' 
        }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Reativar no Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );
    
    // Atualizar banco de dados
    const { error: updateError } = await supabase
      .from('gastronomy_subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);
    
    if (updateError) {
      console.error('Erro ao atualizar banco:', updateError);
      // Não falhar a requisição, pois o Stripe já foi atualizado
    }
    
    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        },
      } as ReactivateResponse),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      } as ReactivateResponse),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});
