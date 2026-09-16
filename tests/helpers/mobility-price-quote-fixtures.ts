import type { SupabaseClient } from '@supabase/supabase-js';

const FIXTURE_RULE_PREFIX = 'E2E Mobility Quote Fixture';

type MobilityQuoteFixtureMode = 'ride' | 'motoboy';

export interface MobilityQuoteFixtureInput {
  passengerProfileId: string;
  pickupAddressId: string;
  dropoffAddressId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
}

export type MobilityRideQuoteFixtureInput = MobilityQuoteFixtureInput;

export interface MobilityQuoteFixture {
  quoteId: string;
  ruleId: string;
  amount: number;
}

export type MobilityRideQuoteFixture = MobilityQuoteFixture;

function fixtureName(mode: MobilityQuoteFixtureMode): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${FIXTURE_RULE_PREFIX} ${mode} ${suffix}`;
}

async function createMobilityQuoteFixture(
  supabaseAdmin: SupabaseClient,
  mode: MobilityQuoteFixtureMode,
  input: MobilityQuoteFixtureInput,
): Promise<MobilityQuoteFixture> {
  const amount = 1;
  const { data: rule, error: ruleError } = await supabaseAdmin
    .from('pricing_rules')
    .insert({
      mode,
      name: fixtureName(mode),
      base_fare: 1,
      price_per_km: 1,
      price_per_minute: 0.1,
      minimum_fare: 1,
      maximum_fare: null,
      is_active: true,
      metadata: {
        commercial_status: 'approved',
        quote_ttl_seconds: 600,
        routing_profile: mode === 'motoboy' ? 'bike' : 'car',
        e2e_mobility_quote_fixture: true,
      },
    })
    .select('id, updated_at')
    .single();

  if (ruleError || !rule?.id || !rule.updated_at) {
    throw ruleError ?? new Error('Failed to create E2E mobility pricing rule');
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 10 * 60_000);
  const routingProfile = mode === 'motoboy' ? 'bike' : 'car';

  const { data: quote, error: quoteError } = await supabaseAdmin
    .from('mobility_price_quotes')
    .insert({
      passenger_profile_id: input.passengerProfileId,
      mode,
      pricing_rule_id: rule.id,
      pricing_rule_updated_at: rule.updated_at,
      pickup_address_id: input.pickupAddressId,
      dropoff_address_id: input.dropoffAddressId,
      pickup_location_id: input.pickupLocationId,
      dropoff_location_id: input.dropoffLocationId,
      origin_lat: input.originLat,
      origin_lng: input.originLng,
      destination_lat: input.destinationLat,
      destination_lng: input.destinationLng,
      distance_meters: 1000,
      duration_seconds: 300,
      amount,
      currency: 'BRL',
      routing_provider: 'e2e-fixture',
      routing_profile: routingProfile,
      quote_engine_version: 'e2e-fixture',
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata: {
        e2e_mobility_quote_fixture: true,
      },
    })
    .select('id')
    .single();

  if (quoteError || !quote?.id) {
    await supabaseAdmin.from('pricing_rules').delete().eq('id', rule.id);
    throw quoteError ?? new Error('Failed to create E2E mobility price quote');
  }

  return { quoteId: quote.id, ruleId: rule.id, amount };
}

/**
 * Creates a technical, single-use ride quote for an isolated operational-test
 * target. This helper must only receive the service-role client returned by
 * createOperationalAdminClient(), which already refuses non-approved mutation
 * targets. It deliberately bypasses commercial routing because Gate 6/7 test
 * lifecycle/PIN behavior, not pricing or routing correctness.
 */
export async function createMobilityRideQuoteFixture(
  supabaseAdmin: SupabaseClient,
  input: MobilityQuoteFixtureInput,
): Promise<MobilityQuoteFixture> {
  return createMobilityQuoteFixture(supabaseAdmin, 'ride', input);
}

/**
 * Same isolation contract as createMobilityRideQuoteFixture, but for motoboy
 * lifecycle/PIN gates. The numeric amount is a technical fixture value only;
 * it is never a commercial policy and never comes from browser payload.
 */
export async function createMobilityDeliveryQuoteFixture(
  supabaseAdmin: SupabaseClient,
  input: MobilityQuoteFixtureInput,
): Promise<MobilityQuoteFixture> {
  return createMobilityQuoteFixture(supabaseAdmin, 'motoboy', input);
}

/**
 * Removes quote/rule fixtures after their rides are cleaned up. Quotes are
 * deleted first because pricing_rule_id intentionally uses ON DELETE RESTRICT.
 */
export async function cleanupMobilityRideQuoteFixtures(
  supabaseAdmin: SupabaseClient,
  ruleIds: readonly string[],
): Promise<void> {
  if (ruleIds.length === 0) return;

  const uniqueRuleIds = [...new Set(ruleIds)];
  const { error: quoteError } = await supabaseAdmin
    .from('mobility_price_quotes')
    .delete()
    .in('pricing_rule_id', uniqueRuleIds);

  if (quoteError) throw quoteError;

  const { error: ruleError } = await supabaseAdmin
    .from('pricing_rules')
    .delete()
    .in('id', uniqueRuleIds);

  if (ruleError) throw ruleError;
}

export const cleanupMobilityQuoteFixtures = cleanupMobilityRideQuoteFixtures;
