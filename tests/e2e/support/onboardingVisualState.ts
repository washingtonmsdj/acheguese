import type { Page } from "@playwright/test";

const ONBOARDING_CONSENT_FIXTURE = [
  { consent_type: "cookies", granted: true },
  { consent_type: "analytics", granted: false },
  { consent_type: "marketing", granted: false },
  { consent_type: "geolocation", granted: false },
  { consent_type: "privacy_policy", granted: true },
] as const;

/**
 * Freezes non-product browser state so visual diffs measure the onboarding UI
 * instead of theme, consent-banner or animation state.
 */
export async function installOnboardingVisualState(page: Page): Promise<void> {
  await page.addInitScript((consents) => {
    try {
      window.localStorage.setItem(
        "achegue-se:last-city",
        JSON.stringify({ city: "Salvador", state: "BA", uf: "ba" }),
      );
      window.localStorage.setItem("acheguese-theme", "light");
      window.localStorage.setItem("lgpd-consent", JSON.stringify(consents));

      const style = document.createElement("style");
      style.innerHTML = `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }`;
      document.documentElement.appendChild(style);
    } catch {
      // Visual tests must remain fail-closed if browser storage is unavailable.
    }
  }, ONBOARDING_CONSENT_FIXTURE);
}
