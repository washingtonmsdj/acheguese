/**
 * EDGE FUNCTION: gastronomy-cancel-subscription
 *
 * Cancela assinatura do vertical Gastronomia.
 * Pode cancelar imediatamente ou no fim do período.
 *
 * Endpoint: /functions/v1/gastronomy-cancel-subscription
 * Method: POST
 * Auth: Required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface CancelRequest {
  businessId: string;
  immediately?: boolean;
}

interface CancelResponse {
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
    const { businessId, immediately = false }: CancelRequest = await req.json();
    
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
    
    // Verificar se já está cancelada
    if (currentSubscription.status === 'canceled') {
      return new Response(
        JSON.stringify({ success: false, error: 'Assinatura já está cancelada' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Se não tem stripe_subscription_id, apenas atualizar banco
    if (!currentSubscription.stripe_subscription_id) {
      const { error: updateError } = await supabase
        .from('gastronomy_subscriptions')
        .update({
          status: 'canceled',
          plan_tier: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);
      
      if (updateError) {
        throw updateError;
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          subscription: {
            status: 'canceled',
            plan_tier: 'free',
          },
        } as CancelResponse),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Cancelar no Stripe
    let updatedSubscription;
    
    if (immediately) {
      // Cancelar imediatamente
      updatedSubscription = await stripe.subscriptions.cancel(
        currentSubscription.stripe_subscription_id
      );
      
      // Atualizar banco imediatamente
      await supabase
        .from('gastronomy_subscriptions')
        .update({
          status: 'canceled',
          plan_tier: 'free',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);
      
    } else {
      // Cancelar no fim do período
      updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );
      
      // Atualizar banco
      await supabase
        .from('gastronomy_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);
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
      } as CancelResponse),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      } as CancelResponse),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});
