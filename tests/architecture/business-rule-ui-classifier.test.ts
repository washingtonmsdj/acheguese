import { describe, expect, it } from "vitest";
import { findBusinessRuleConditions } from "../../tools/architecture/business-rule-ui-classifier";

describe("business rule UI classifier", () => {
  it("finds domain guards in if and non-rendering ternary conditions", () => {
    const source = `
      function Page({ profileData, driver }) {
        if (profileData.profile_type === "driver") return null;
        const canContinue = driver.status === "verified" ? true : false;
        return canContinue;
      }
    `;

    expect(findBusinessRuleConditions(source, "Page.tsx")).toEqual([
      'profileData.profile_type === "driver"',
      'driver.status === "verified"',
    ]);
  });

  it("ignores display-only conditions inside JSX", () => {
    const source = `
      function ConceptPage({ profile, business, driver }) {
        return <nav>{profile.verified ? <span>Verificado</span> : null}{business.is_verified ? <span>Verificada</span> : null}{profile.secondaryAction ? <button type="button">{profile.secondaryAction}</button> : null}{driver ? <button type="button">Abrir</button> : null}</nav>;
      }
    `;

    expect(findBusinessRuleConditions(source, "ConceptPage.tsx")).toEqual([]);
  });
});
