import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/pages/TerritoryEntryPage.tsx", "utf8");

describe("TerritoryEntryPage SPA navigation", () => {
  it("uses router links for internal routes while preserving local hash anchors", () => {
    expect(page).toContain('import { Link } from "react-router-dom";');
    expect(page).toContain('<a href="#conteudo" className="ag-skip-link">');
    expect(page).toContain('<a href="#descobrir">Por perto</a>');
    expect(page).toContain('<Link to={launchBusinessUrl}>Para negócios</Link>');
    expect(page).toContain('to={launchMapUrl}');
    expect(page).toContain('to={launchNearbyUrl}');
    expect(page).toContain('<Link to={module.href} aria-label=');
    expect(page).toContain('<Link to={PRIVACY_POLICY_PATH}>Privacidade</Link>');

    expect(page).not.toContain('<a href={launchBusinessUrl}>');
    expect(page).not.toContain('href={launchMapUrl}');
    expect(page).not.toContain('href={launchNearbyUrl}');
    expect(page).not.toContain('<a href={module.href}');
    expect(page).not.toContain('<a href={accountHref}');
  });
});
