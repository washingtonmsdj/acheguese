/**
 * SSOT de politica de captura residencial por cidade.
 *
 * Regra atual:
 * - referencia/localidade complementar so eh permitida em cidades aprovadas.
 * - em Salvador, deve permanecer desabilitada.
 */
const CITIES_WITH_LOCAL_REFERENCE = new Set<string>([
  "conceicao do jacuipe",
]);

function normalizeCityName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function canUseResidenceLocalReference(cityName: string | null | undefined): boolean {
  if (!cityName) return false;
  return CITIES_WITH_LOCAL_REFERENCE.has(normalizeCityName(cityName));
}

export function getResidenceLocalReferenceEnabledCities(): string[] {
  return Array.from(CITIES_WITH_LOCAL_REFERENCE);
}
