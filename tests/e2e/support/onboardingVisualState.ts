import type { Page, Route } from "@playwright/test";

const ONBOARDING_CONSENT_FIXTURE = [
  { consent_type: "cookies", granted: true },
  { consent_type: "analytics", granted: false },
  { consent_type: "marketing", granted: false },
  { consent_type: "geolocation", granted: false },
  { consent_type: "privacy_policy", granted: true },
] as const;

const VISUAL_CITY_ID = "11111111-1111-4111-8111-111111111111";
const FIXTURE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const ONBOARDING_LOCATION_FIXTURE = {
  city: {
    id: VISUAL_CITY_ID,
    parent_id: "22222222-2222-4222-8222-222222222222",
    type: "city",
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, BA",
    geographic_path: "/br/ba/salvador",
    status: "active",
    metadata: {},
    created_at: FIXTURE_TIMESTAMP,
    updated_at: FIXTURE_TIMESTAMP,
  },
  neighborhoods: [
    "Acupe",
    "Aeroporto",
    "Águas Claras",
    "Alto da Terezinha",
    "Alto das Pombas",
    "Amaralina",
  ].map((name, index) => ({
    id: `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`,
    parent_id: VISUAL_CITY_ID,
    type: "neighborhood",
    slug: name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
    full_name: `${name}, Salvador, BA`,
    geographic_path: `/br/ba/salvador/${name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`,
    status: "active",
    metadata: {},
    created_at: FIXTURE_TIMESTAMP,
    updated_at: FIXTURE_TIMESTAMP,
  })),
} as const;

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization,apikey,x-client-info,content-profile,accept-profile,range,prefer",
  "access-control-allow-methods": "GET,HEAD,OPTIONS",
} as const;

async function fulfillCorsPreflight(route: Route): Promise<boolean> {
  if (route.request().method() !== "OPTIONS") return false;
  await route.fulfill({ status: 204, headers: CORS_HEADERS, body: "" });
  return true;
}

async function installOnboardingTerritoryFixture(page: Page): Promise<void> {
  await page.route("**/rest/v1/locations*", async (route) => {
    if (await fulfillCorsPreflight(route)) return;

    const url = new URL(route.request().url());
    const geographicPath = url.searchParams.get("geographic_path");
    const parentId = url.searchParams.get("parent_id");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");

    if (geographicPath === "eq./br/ba/salvador") {
      await route.fulfill({
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "content-type": "application/json",
          "content-range": "0-0/1",
        },
        json: [ONBOARDING_LOCATION_FIXTURE.city],
      });
      return;
    }

    if (
      parentId === `eq.${VISUAL_CITY_ID}` &&
      type === "eq.neighborhood" &&
      status === "eq.active"
    ) {
      await route.fulfill({
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "content-type": "application/json",
          "content-range": `0-${ONBOARDING_LOCATION_FIXTURE.neighborhoods.length - 1}/${ONBOARDING_LOCATION_FIXTURE.neighborhoods.length}`,
        },
        json: ONBOARDING_LOCATION_FIXTURE.neighborhoods,
      });
      return;
    }

    await route.fulfill({
      status: 500,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
      json: {
        message: `Unexpected locations query in onboarding visual test: ${url.search}`,
      },
    });
  });

  await page.route("**/rest/v1/city_metadata*", async (route) => {
    if (await fulfillCorsPreflight(route)) return;

    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
      json: {
        id: "salvador-ba",
        city: "Salvador",
        state: "BA",
        population: 0,
        districts_count: ONBOARDING_LOCATION_FIXTURE.neighborhoods.length,
        active_businesses: 0,
        schools_count: 0,
        professionals_count: 0,
        bus_lines_count: 0,
        city_status: "active",
      },
    });
  });
}

/**
 * Freezes browser state and territorial reads so visual diffs measure the
 * onboarding UI rather than theme, consent state or remote-data availability.
 */
export async function installOnboardingVisualState(page: Page): Promise<void> {
  await installOnboardingTerritoryFixture(page);

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
