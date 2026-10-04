import { describe, expect, it } from "vitest";
import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";
import { CSP_DIRECTIVES, generateCSPString } from "../../src/shared/config/security.config";

const ADVERTISING_ORIGINS = [
  "pagead2.googlesyndication.com",
  "googlesyndication.com",
  "googleadservices.com",
  "doubleclick.net",
  "adtrafficquality.google",
] as const;

describe("MVP CSP least privilege", () => {
  it("keeps paused advertising dependencies out of the browser policy", () => {
    expect(PRODUCT_MODULE_REGISTRY.gastronomy.status).toBe("paused");

    const csp = generateCSPString();
    for (const origin of ADVERTISING_ORIGINS) {
      expect(csp).not.toContain(origin);
    }
  });

  it("does not authorize third-party script origins without an active runtime caller", () => {
    expect(CSP_DIRECTIVES["script-src"]).not.toContain("https://cdn.jsdelivr.net");
    expect(CSP_DIRECTIVES["script-src"]).not.toContain("https://*.supabase.co");
    expect(CSP_DIRECTIVES["style-src"]).not.toContain("https://cdn.jsdelivr.net");
    expect(CSP_DIRECTIVES["font-src"]).not.toContain("https://cdn.jsdelivr.net");
  });

  it("blocks inline HTML event-handler attributes", () => {
    expect(CSP_DIRECTIVES["script-src-attr"]).toEqual(["'none'"]);
  });
});
