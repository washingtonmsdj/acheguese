import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const ANALYTICS_OWNER = path.normalize(
  "src/app/components/privacy/ConsentAwareVercelAnalytics.tsx",
);
const CONSENT_STORAGE_OWNER = path.normalize(
  "src/core/privacy/services/ConsentService.ts",
);

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

describe("analytics consent boundary", () => {
  it("keeps the Vercel analytics package behind one consent-aware owner", () => {
    const packageImporters = collectSourceFiles(SRC)
      .map((absolute) => ({
        relative: path.normalize(path.relative(ROOT, absolute)),
        source: fs.readFileSync(absolute, "utf8"),
      }))
      .filter(({ source }) => source.includes("@vercel/analytics/react"))
      .map(({ relative }) => relative);

    expect(packageImporters).toEqual([ANALYTICS_OWNER]);

    const owner = read(ANALYTICS_OWNER);
    expect(owner).toContain("useAnalyticsConsent()");
    expect(owner).toContain("!analyticsConsent");
    expect(owner).toContain('import("@vercel/analytics/react")');
  });

  it("keeps the local consent storage key and parsing in one owner", () => {
    const storageKeyOwners = collectSourceFiles(SRC)
      .map((absolute) => ({
        relative: path.normalize(path.relative(ROOT, absolute)),
        source: fs.readFileSync(absolute, "utf8"),
      }))
      .filter(({ source }) => source.includes('"lgpd-consent"'))
      .map(({ relative }) => relative);

    expect(storageKeyOwners).toEqual([CONSENT_STORAGE_OWNER]);

    const service = read(CONSENT_STORAGE_OWNER);
    expect(service).toContain('LOCAL_CONSENT_STORAGE_KEY = "lgpd-consent"');
    expect(service).toContain("function readLocalConsentRecords");
    expect(service).toContain("JSON.parse(localConsent)");
    expect(service).toContain("catch {");
  });

  it("reacts to same-tab and cross-tab consent changes", () => {
    const service = read(CONSENT_STORAGE_OWNER);
    const hook = read("src/core/privacy/hooks/useConsentPermission.ts");

    expect(service).toContain(
      'CONSENT_PREFERENCES_CHANGED_EVENT =\n  "acheguese:consent-preferences-changed"',
    );
    expect(service).toContain("notifyLocalConsentChanged()");
    expect(service).toContain('window.addEventListener("storage", handleStorage)');
    expect(service).toContain("CONSENT_PREFERENCES_CHANGED_EVENT");
    expect(service).toContain("hasGrantedLocalConsent");

    expect(hook).toContain("useSyncExternalStore");
    expect(hook).toContain('hasGrantedLocalConsent("analytics")');
    expect(hook).toContain("subscribeToLocalConsent");
  });

  it("uses the same analytics owner on public and routed overlays", () => {
    const publicOverlays = read("src/app/components/PublicRootOverlays.tsx");
    const globalOverlays = read("src/app/components/GlobalOverlays.tsx");

    for (const source of [publicOverlays, globalOverlays]) {
      expect(source).toContain("ConsentAwareVercelAnalytics");
      expect(source).not.toContain("@vercel/analytics/react");
      expect(source).not.toContain("shouldLoadVercelAnalytics");
    }
  });
});
