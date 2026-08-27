import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SECURITY_DOMAINS,
  TURNSTILE_CLIENT_CONFIG,
} from "../../src/shared/config/security.config";
import {
  parseCsp,
  validateTurnstileCspContract,
  type TurnstileCspContractInput,
} from "../../tools/security/csp-contract";

const root = process.cwd();
const turnstileOrigin = SECURITY_DOMAINS.CLOUDFLARE_TURNSTILE.url;
const canonicalWidgetSource = `
  import { TURNSTILE_CLIENT_CONFIG } from "@/shared/config/security.config";
  const scriptUrl = TURNSTILE_CLIENT_CONFIG.scriptUrl;
`;
const canonicalCsp =
  [
    "default-src 'self'",
    `script-src 'self' ${turnstileOrigin}`,
    `frame-src 'self' ${turnstileOrigin}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ") + ";";

function contractInput(
  overrides: Partial<TurnstileCspContractInput> = {},
): TurnstileCspContractInput {
  return {
    deployedCsp: canonicalCsp,
    ssotCsp: canonicalCsp,
    turnstileOrigin,
    turnstileScriptUrl: TURNSTILE_CLIENT_CONFIG.scriptUrl,
    widgetSource: canonicalWidgetSource,
    ...overrides,
  };
}

describe("Cloudflare Turnstile CSP contract", () => {
  it("passes with the exact origin in script-src and frame-src", () => {
    expect(validateTurnstileCspContract(contractInput())).toEqual([]);
  });

  it("fails when script-src omits the canonical origin", () => {
    const deployedCsp = canonicalCsp.replace(
      `script-src 'self' ${turnstileOrigin}`,
      "script-src 'self'",
    );

    expect(
      validateTurnstileCspContract(
        contractInput({ deployedCsp, ssotCsp: deployedCsp }),
      ),
    ).toContain(
      `script-src deve conter a origem canonica exata do Turnstile: ${turnstileOrigin}`,
    );
  });

  it("fails when frame-src omits the canonical origin", () => {
    const deployedCsp = canonicalCsp.replace(
      `frame-src 'self' ${turnstileOrigin}`,
      "frame-src 'self'",
    );

    expect(
      validateTurnstileCspContract(
        contractInput({ deployedCsp, ssotCsp: deployedCsp }),
      ),
    ).toContain(
      `frame-src deve conter a origem canonica exata do Turnstile: ${turnstileOrigin}`,
    );
  });

  it("fails when a generic Cloudflare wildcard replaces the exact origin", () => {
    const deployedCsp = canonicalCsp.replaceAll(
      turnstileOrigin,
      "https://*.cloudflare.com",
    );
    const errors = validateTurnstileCspContract(
      contractInput({ deployedCsp, ssotCsp: deployedCsp }),
    );

    expect(errors.some((error) => error.includes("wildcard Cloudflare"))).toBe(
      true,
    );
    expect(
      errors.some((error) => error.includes("origem canonica exata")),
    ).toBe(true);
  });

  it("fails when vercel.json diverges from the security SSOT", () => {
    expect(
      validateTurnstileCspContract(
        contractInput({ deployedCsp: `${canonicalCsp} report-uri /csp;` }),
      ),
    ).toContain(
      "CSP de vercel.json diverge do SSOT src/shared/config/security.config.ts",
    );
  });

  it("fails when the widget bypasses the canonical client configuration", () => {
    expect(
      validateTurnstileCspContract(
        contractInput({
          widgetSource:
            'const scriptUrl = "https://example.com/turnstile/v0/api.js";',
        }),
      ),
    ).toContain(
      "TurnstileWidget deve consumir TURNSTILE_CLIENT_CONFIG.scriptUrl sem origem hardcoded",
    );
  });

  it("fails when the configured script URL diverges from the canonical origin", () => {
    expect(
      validateTurnstileCspContract(
        contractInput({
          turnstileScriptUrl: "https://example.com/turnstile/v0/api.js",
        }),
      ),
    ).toContain("URL do cliente Turnstile diverge da origem canonica do SSOT");
  });

  it("keeps the generated production policy strict and synchronized", () => {
    const vercelConfig = JSON.parse(
      readFileSync(resolve(root, "vercel.json"), "utf8"),
    ) as {
      headers: Array<{
        headers: Array<{ key: string; value: string }>;
      }>;
    };
    const deployedCsp = vercelConfig.headers
      .flatMap((entry) => entry.headers)
      .find((header) => header.key === "Content-Security-Policy")?.value;
    const widgetSource = readFileSync(
      resolve(root, "src/shared/components/security/TurnstileWidget.tsx"),
      "utf8",
    );

    expect(deployedCsp).toBeTruthy();
    expect(
      validateTurnstileCspContract(
        contractInput({
          deployedCsp: deployedCsp ?? "",
          // Vitest runs with import.meta.env.DEV=true; exact production SSOT
          // synchronization is exercised by validate:csp in a Node/tsx process.
          ssotCsp: deployedCsp ?? "",
          widgetSource,
        }),
      ),
    ).toEqual([]);

    const directives = parseCsp(deployedCsp ?? "");
    expect(directives.get("script-src")).not.toContain("'unsafe-inline'");
    expect(directives.get("script-src")).not.toContain("'unsafe-eval'");
    expect(directives.get("frame-ancestors")).toEqual(["'none'"]);
    expect(directives.get("object-src")).toEqual(["'none'"]);
    expect(directives.get("connect-src")).not.toContain(turnstileOrigin);
  });
});
