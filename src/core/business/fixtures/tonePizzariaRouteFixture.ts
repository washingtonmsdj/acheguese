export const TONE_PIZZARIA_ROUTE_FIXTURE_ID = "00000000-0000-4000-8000-000000000101";
export const TONE_PIZZARIA_ROUTE_FIXTURE_SLUG = "tone-cos-loja";

interface TonePizzariaRouteFixtureParams {
  readonly state?: string | null;
  readonly city?: string | null;
  readonly district?: string | null;
  readonly slug?: string | null;
}

export function isTonePizzariaRouteFixture(
  params: Pick<TonePizzariaRouteFixtureParams, "slug">,
): boolean {
  return Boolean(import.meta.env.DEV && params.slug === TONE_PIZZARIA_ROUTE_FIXTURE_SLUG);
}

export function buildTonePizzariaFixtureGeographicPath(
  params: TonePizzariaRouteFixtureParams,
): string {
  return `/br/${params.state ?? "ba"}/${params.city ?? "salvador"}/${params.district ?? "complexo-do-nordeste-de-amaralina"}`;
}
