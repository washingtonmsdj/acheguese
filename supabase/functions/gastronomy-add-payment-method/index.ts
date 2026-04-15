/**
 * EDGE FUNCTION: gastronomy-add-payment-method
 *
 * Adiciona ou atualiza método de pagamento de um customer.
 * Define o método como padrão para cobranças futuras.
 *
 * Endpoint: /functions/v1/gastronomy-add-payment-method
 * Method: POST
 * Auth: Required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface AddPaymentMethodRequest {
  businessId: string;
  paymentMethodId: string;
}

interface AddPaymentMethodResponse {
  success: boolean;
  customer?: any;
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
    const { businessId, paymentMethodId }: AddPaymentMethodRequest = await req.json();
    
    // Validate input
    if (!businessId || !paymentMethodId) {
      return new Response(
        JSON.stringify({ success: false, error: 'businessId e paymentMethodId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar assinatura para obter stripe_customer_id
    const { data: subscription, error: fetchError } = await supabase
      .from('gastronomy_subscriptions')
      .select('stripe_customer_id')
      .eq('business_id', businessId)
      .single();
    
    if (fetchError || !subscription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assinatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    if (!subscription.stripe_customer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer Stripe não encontrado' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
    
    // Anexar payment method ao customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripe_customer_id,
    });
    
    // Definir como método padrão
    const updatedCustomer = await stripe.customers.update(
      subscription.stripe_customer_id,
      {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      }
    );
    
    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        customer: {
          id: updatedCustomer.id,
          default_payment_method: paymentMethodId,
        },
      } as AddPaymentMethodResponse),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao adicionar método de pagamento:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      } as AddPaymentMethodResponse),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});
