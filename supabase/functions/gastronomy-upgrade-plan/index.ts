/**
 * EDGE FUNCTION: gastronomy-upgrade-plan
 *
 * Gerencia upgrade/downgrade de planos do vertical Gastronomia.
 * Integra com Stripe e atualiza banco de dados.
 *
 * Endpoint: /functions/v1/gastronomy-upgrade-plan
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
import { validateBody, gastronomyUpgradeSchema, validationErrorResponse, type GastronomyUpgradeBody } from '../_shared/validation.ts';

interface UpgradeResponse {
  success: boolean;
  subscription?: unknown;
  error?: string;
  [key: string]: unknown;
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_PRICE_ID_PRO = Deno.env.get('STRIPE_PRICE_ID_PRO')!;
const STRIPE_PRICE_ID_DELIVERY = Deno.env.get('STRIPE_PRICE_ID_DELIVERY')!;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getPriceId(planTier: 'pro' | 'delivery'): string {
  return planTier === 'pro' ? STRIPE_PRICE_ID_PRO : STRIPE_PRICE_ID_DELIVERY;
}

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
    const bodyValidation = validateBody<GastronomyUpgradeBody>(rawBody, gastronomyUpgradeSchema);
    if (!bodyValidation.ok) {
      return validationErrorResponse(bodyValidation.errors);
    }
    const { businessId, newPlanTier, prorationBehavior } = bodyValidation.data!;

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

    if (currentSubscription.plan_tier === newPlanTier) {
      return jsonSecurityResponse(
        { success: false, error: 'Ja esta no plano desejado' },
        400,
      );
    }

    if (!currentSubscription.stripe_subscription_id) {
      return jsonSecurityResponse(
        {
          success: false,
          error: 'Assinatura Stripe nao encontrada. Use create-subscription primeiro.',
        },
        400,
      );
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripe_subscription_id,
    );

    const firstItem = stripeSubscription.items.data[0];
    if (!firstItem?.id) {
      return jsonSecurityResponse(
        { success: false, error: 'Assinatura Stripe sem item para atualizacao' },
        422,
      );
    }

    const priceId = getPriceId(newPlanTier);

    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        items: [
          {
            id: firstItem.id,
            price: priceId,
          },
        ],
        proration_behavior: prorationBehavior || 'create_prorations',
        metadata: {
          ...stripeSubscription.metadata,
          plan_tier: newPlanTier,
        },
      },
    );

    const { error: updateError } = await supabase
      .from('gastronomy_subscriptions')
      .update({
        plan_tier: newPlanTier,
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
          plan_tier: newPlanTier,
          status: updatedSubscription.status,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        },
      } as UpgradeResponse,
      200,
    );
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);

    return jsonSecurityResponse(
      {
        success: false,
        error: 'Erro interno ao atualizar plano',
      } as UpgradeResponse,
      500,
    );
  }
});

