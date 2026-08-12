export type TurnstileCspContractInput = {
  deployedCsp: string;
  ssotCsp: string;
  turnstileOrigin: string;
  turnstileScriptUrl: string;
  widgetSource: string;
};

export function parseCsp(value: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const section of value.split(";")) {
    const tokens = section.trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) directives.set(tokens[0], tokens.slice(1));
  }
  return directives;
}

function isGenericCloudflareWildcard(source: string): boolean {
  return /^https:\/\/\*\.(?:[^/]+\.)*cloudflare\.com$/i.test(source);
}

export function validateTurnstileCspContract({
  deployedCsp,
  ssotCsp,
  turnstileOrigin,
  turnstileScriptUrl,
  widgetSource,
}: TurnstileCspContractInput): string[] {
  const errors: string[] = [];

  if (deployedCsp !== ssotCsp) {
    errors.push(
      "CSP de vercel.json diverge do SSOT src/config/security.config.ts",
    );
  }

  let scriptOrigin = "";
  try {
    scriptOrigin = new URL(turnstileScriptUrl).origin;
  } catch {
    errors.push("URL canonica do cliente Turnstile e invalida");
  }

  if (scriptOrigin && scriptOrigin !== turnstileOrigin) {
    errors.push("URL do cliente Turnstile diverge da origem canonica do SSOT");
  }

  if (
    widgetSource.includes("https://challenges.cloudflare.com") ||
    !/TURNSTILE_CLIENT_CONFIG\.scriptUrl/.test(widgetSource)
  ) {
    errors.push(
      "TurnstileWidget deve consumir TURNSTILE_CLIENT_CONFIG.scriptUrl sem origem hardcoded",
    );
  }

  const directives = parseCsp(deployedCsp);
  for (const directive of ["script-src", "frame-src"] as const) {
    const sources = directives.get(directive) ?? [];
    if (!sources.includes(turnstileOrigin)) {
      errors.push(
        `${directive} deve conter a origem canonica exata do Turnstile: ${turnstileOrigin}`,
      );
    }
    if (sources.some(isGenericCloudflareWildcard)) {
      errors.push(
        `${directive} nao pode substituir a origem exata do Turnstile por wildcard Cloudflare`,
      );
    }
  }

  return errors;
}
