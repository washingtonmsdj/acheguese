/**
 * EDGE FUNCTION: gastronomy-cancel-subscription
 *
 * Cancela assinatura do vertical Gastronomia.
 * Pode cancelar imediatamente ou no fim do periodo.
 *
 * Endpoint: /functions/v1/gastronomy-cancel-subscription
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

interface CancelRequest {
  businessId: string;
  immediately?: boolean;
}

interface CancelResponse {
  success: boolean;
  subscription?: unknown;
  error?: string;
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
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
    const { businessId, immediately = false }: CancelRequest = await req.json();

    if (!businessId) {
      return jsonSecurityResponse({ success: false, error: 'businessId e obrigatorio' }, 400);
    }

    const accessCheck = await requireBusinessManagementAccess(req, supabase, businessId);
    if (accessCheck instanceof Response) {
      return accessCheck;
    }

    const { data: currentSubscription, error: fetchError } = await supabase
      .from('gastronomy_subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (fetchError || !currentSubscription) {
      return jsonSecurityResponse({ success: false, error: 'Assinatura nao encontrada' }, 404);
    }

    if (currentSubscription.status === 'canceled') {
      return jsonSecurityResponse(
        { success: false, error: 'Assinatura ja esta cancelada' },
        400,
      );
    }

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

      return jsonSecurityResponse(
        {
          success: true,
          subscription: {
            status: 'canceled',
            plan_tier: 'free',
          },
        } as CancelResponse,
        200,
      );
    }

    let updatedSubscription;

    if (immediately) {
      updatedSubscription = await stripe.subscriptions.cancel(
        currentSubscription.stripe_subscription_id,
      );

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
      updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        },
      );

      await supabase
        .from('gastronomy_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);
    }

    return jsonSecurityResponse(
      {
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        },
      } as CancelResponse,
      200,
    );
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);

    return jsonSecurityResponse(
      {
        success: false,
        error: 'Erro interno ao cancelar assinatura',
      } as CancelResponse,
      500,
    );
  }
});

