/**
 * EDGE FUNCTION: gastronomy-add-payment-method
 *
 * Adiciona ou atualiza metodo de pagamento de um customer.
 * Define o metodo como padrao para cobrancas futuras.
 *
 * Endpoint: /functions/v1/gastronomy-add-payment-method
 * Method: POST
 * Auth: Required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';
import { getAllSecurityHeaders, isOriginAllowed } from '../_shared/security.ts';
import {
  jsonSecurityResponse,
  requireBusinessManagementAccess,
} from '../_shared/businessAuth.ts';
import { validateBody, gastronomyAddPaymentSchema, validationErrorResponse, type GastronomyAddPaymentBody } from '../_shared/validation.ts';

interface AddPaymentMethodResponse {
  success: boolean;
  customer?: unknown;
  error?: string;
  [key: string]: unknown;
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return jsonSecurityResponse({ success: false, error: 'Origin not allowed' }, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders('POST, OPTIONS'),
    });
  }

  try {
    const rawBody = await req.json();
    const bodyValidation = validateBody<GastronomyAddPaymentBody>(rawBody, gastronomyAddPaymentSchema);
    if (!bodyValidation.ok) {
      return validationErrorResponse(bodyValidation.errors);
    }
    const { businessId, paymentMethodId } = bodyValidation.data!;

    const accessCheck = await requireBusinessManagementAccess(req, supabase, businessId);
    if (accessCheck instanceof Response) {
      return accessCheck;
    }

    const { data: subscription, error: fetchError } = await supabase
      .from('gastronomy_subscriptions')
      .select('stripe_customer_id')
      .eq('business_id', businessId)
      .single();

    if (fetchError || !subscription) {
      return jsonSecurityResponse(
        { success: false, error: 'Assinatura nao encontrada' },
        404,
      );
    }

    if (!subscription.stripe_customer_id) {
      return jsonSecurityResponse(
        { success: false, error: 'Customer Stripe nao encontrado' },
        400,
      );
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripe_customer_id,
    });

    const updatedCustomer = await stripe.customers.update(subscription.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return jsonSecurityResponse(
      {
        success: true,
        customer: {
          id: updatedCustomer.id,
          default_payment_method: paymentMethodId,
        },
      } as AddPaymentMethodResponse,
      200,
    );
  } catch (error) {
    console.error('Erro ao adicionar metodo de pagamento:', error);

    return jsonSecurityResponse(
      {
        success: false,
        error: 'Erro interno ao adicionar metodo de pagamento',
      } as AddPaymentMethodResponse,
      500,
    );
  }
});

