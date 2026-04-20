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
import { getAllSecurityHeaders, isOriginAllowed } from '../_shared/security.ts';
import {
  jsonSecurityResponse,
  requireBusinessManagementAccess,
} from '../_shared/businessAuth.ts';
import { validateBody, gastronomyBusinessSchema, validationErrorResponse } from '../_shared/validation.ts';

interface ReactivateResponse {
  success: boolean;
  subscription?: unknown;
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
    const bodyValidation = validateBody<{ businessId: string }>(rawBody, gastronomyBusinessSchema);
    if (!bodyValidation.ok) {
      return validationErrorResponse(bodyValidation.errors);
    }
    const { businessId } = bodyValidation.data!;

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

    if (!currentSubscription.cancel_at_period_end) {
      return jsonSecurityResponse(
        { success: false, error: 'Assinatura nao esta marcada para cancelamento' },
        400,
      );
    }

    if (!currentSubscription.stripe_subscription_id) {
      return jsonSecurityResponse(
        { success: false, error: 'Assinatura Stripe nao encontrada' },
        400,
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      },
    );

    const { error: updateError } = await supabase
      .from('gastronomy_subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    if (updateError) {
      console.error('Erro ao atualizar banco:', updateError);
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
      } as ReactivateResponse,
      200,
    );
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);

    return jsonSecurityResponse(
      {
        success: false,
        error: 'Erro interno ao reativar assinatura',
      } as ReactivateResponse,
      500,
    );
  }
});

