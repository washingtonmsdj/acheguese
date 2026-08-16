const PRODUCTION_HOSTS = new Set(["acheguese.com.br", "www.acheguese.com.br"]);

function isProductionUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    return PRODUCTION_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function hasIsolatedBusinessMutationTarget(): boolean {
  const target = process.env.E2E_BUSINESS_TARGET?.trim().toLowerCase();
  const approved = process.env.E2E_BUSINESS_MUTATION_APPROVED === "true";

  if (!approved || target !== "isolated") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (isProductionUrl(process.env.PLAYWRIGHT_BASE_URL)) return false;
  if (isProductionUrl(process.env.VITE_PUBLIC_APP_URL)) return false;

  return true;
}

export function assertIsolatedBusinessMutationTarget(operation: string): void {
  if (hasIsolatedBusinessMutationTarget()) return;

  throw new Error(
    `${operation} bloqueada: fixtures de business exigem ` +
      `E2E_BUSINESS_TARGET=isolated e E2E_BUSINESS_MUTATION_APPROVED=true ` +
      `fora de Production. Configure uma base remota isolada; nunca use a ` +
      `base pública para criar dados técnicos.`,
  );
}

export function technicalBusinessMetadata(): Record<string, string> {
  return {
    source: "e2e",
    source_kind: "technical_fixture",
  };
}
