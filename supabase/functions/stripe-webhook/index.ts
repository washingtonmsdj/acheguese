/**
 * EDGE FUNCTION: stripe-webhook
 *
 * Recebe e processa webhooks do Stripe.
 * Mantém sincronização entre Stripe e banco de dados.
 *
 * Endpoint: /functions/v1/stripe-webhook
 * Method: POST
 * Auth: Webhook signature verification
 *
 * Eventos processados:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';
import { 
  getAllSecurityHeaders, 
  rateLimitMiddleware,
  auditLog,
  getAuditInfo,
  errorResponse,
  sanitizeString,
  isValidUUID,
} from '../_shared/security.ts';

// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'trialing' {
  const statusMap: Record<Stripe.Subscription.Status, 'active' | 'canceled' | 'past_due' | 'trialing'> = {
    'active': 'active',
    'canceled': 'canceled',
    'incomplete': 'past_due',
    'incomplete_expired': 'canceled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'unpaid': 'past_due',
    'paused': 'canceled',
  };
  
  return statusMap[stripeStatus] || 'canceled';
}

// ══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════════════

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.created:', subscription.id);
  
  const businessId = subscription.metadata.business_id;
  const planTier = subscription.metadata.plan_tier as 'pro' | 'delivery';
  
  // Validação de entrada
  if (!businessId || !isValidUUID(businessId)) {
    console.error('Invalid business_id:', businessId);
    throw new Error('Invalid business_id in metadata');
  }
  
  if (!planTier || !['pro', 'delivery'].includes(planTier)) {
    console.error('Invalid plan_tier:', planTier);
    throw new Error('Invalid plan_tier in metadata');
  }
  
  // Inserir ou atualizar assinatura
  const { error } = await supabase
    .from('gastronomy_subscriptions')
    .upsert({
      business_id: businessId,
      plan_tier: planTier,
      status: mapSubscriptionStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'business_id',
    });
  
  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
  
  auditLog({
    timestamp: new Date().toISOString(),
    action: 'subscription_created',
    resource: 'gastronomy_subscriptions',
    status: 'success',
    details: { businessId, planTier, subscriptionId: subscription.id },
  });
  
  console.log('Subscription created successfully');
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.updated:', subscription.id);
  
  const businessId = subscription.metadata.business_id;
  const planTier = subscription.metadata.plan_tier as 'pro' | 'delivery';
  
  if (!businessId) {
    console.error('Missing business_id in metadata');
    return;
  }
  
  // Atualizar assinatura
  const { error } = await supabase
    .from('gastronomy_subscriptions')
    .update({
      plan_tier: planTier || undefined,
      status: mapSubscriptionStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
  
  console.log('Subscription updated successfully');
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription.deleted:', subscription.id);
  
  // Atualizar status para canceled e downgrade para free
  const { error } = await supabase
    .from('gastronomy_subscriptions')
    .update({
      status: 'canceled',
      plan_tier: 'free',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
  
  console.log('Subscription deleted successfully');
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('Invoice not related to subscription, skipping');
    return;
  }
  
  // Atualizar status para active
  const { error } = await supabase
    .from('gastronomy_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);
  
  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
  
  console.log('Payment succeeded, subscription activated');
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('Invoice not related to subscription, skipping');
    return;
  }
  
  // Atualizar status para past_due
  const { error } = await supabase
    .from('gastronomy_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);
  
  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
  
  console.log('Payment failed, subscription marked as past_due');
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  const auditInfo = getAuditInfo(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: getAllSecurityHeaders('POST, OPTIONS'),
    });
  }
  
  // Rate limiting (mais permissivo para webhooks do Stripe)
  const rateLimitResponse = rateLimitMiddleware(req, 1000, 60000);
  if (rateLimitResponse) return rateLimitResponse;
  
  try {
    // Get signature and body
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'webhook_failed',
        resource: 'stripe_webhook',
        status: 'failure',
        details: { reason: 'missing_signature' },
        ...auditInfo,
      });
      
      return errorResponse('Missing stripe-signature header', 400);
    }
    
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'webhook_failed',
        resource: 'stripe_webhook',
        status: 'failure',
        details: { reason: 'invalid_signature' },
        ...auditInfo,
      });
      
      return errorResponse('Invalid signature', 400);
    }
    
    console.log('Processing event:', event.type);
    
    // Process event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    auditLog({
      timestamp: new Date().toISOString(),
      action: 'webhook_processed',
      resource: 'stripe_webhook',
      status: 'success',
      details: { eventType: event.type, eventId: event.id },
      ...auditInfo,
    });
    
    // Return success
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: getAllSecurityHeaders() }
    );
    
  } catch (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: 'webhook_error',
      resource: 'stripe_webhook',
      status: 'failure',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ...auditInfo,
    });
    
    return errorResponse('Webhook processing failed', 500, error);
  }
});
