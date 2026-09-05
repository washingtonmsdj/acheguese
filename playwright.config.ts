import { dirname, join } from "path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import { getRemoteMutationTargetSafety } from "./tools/supabase/remote-mutation-safety.ts";

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local", override: true });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8099";
const parsedBaseURL = new URL(baseURL);
const webServerHost = parsedBaseURL.hostname;
const webServerPort = parsedBaseURL.port || (parsedBaseURL.protocol === "https:" ? "443" : "80");
const usesLocalWebServer = ["127.0.0.1", "localhost"].includes(webServerHost);
// CI can provide a separately built and readiness-checked preview server.
// Keep the existing Vite DEV server behavior for local Playwright use.
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

const mutationTargetSafety = getRemoteMutationTargetSafety(
  process.env.VITE_SUPABASE_URL,
);
const authenticatedBusinessLifecycleEnabled =
  process.env.E2E_BUSINESS_LIFECYCLE_AUTHENTICATED === "true";
const authenticatedBusinessLifecycleIgnore =
  authenticatedBusinessLifecycleEnabled
    ? []
    : [/[\\/]business-lifecycle-authenticated\.spec\.ts$/];

const authenticatedEducationLifecycleEnabled =
  process.env.E2E_EDUCATION_LIFECYCLE_AUTHENTICATED === "true";
const authenticatedEducationLifecycleIgnore =
  authenticatedEducationLifecycleEnabled
    ? []
    : [/[\\/]education-lifecycle-authenticated\.spec\.ts$/];

const mutatingE2EIgnore = mutationTargetSafety.safe
  ? []
  : [
      /[\\/]admin-pricing\.spec\.ts$/,
      /[\\/]auth-business\.spec\.ts$/,
      /[\\/]business-recommendation-operational\.spec\.ts$/,
      /[\\/]communication-territorial-operational\.spec\.ts$/,
      /[\\/]community-access-gate\.spec\.ts$/,
      /[\\/]gastronomy-onboarding\.spec\.ts$/,
      /[\\/]gastronomy-operational\.spec\.ts$/,
      /[\\/]education[\\/].*\.spec\.ts$/,
    ];

// Compatible with ESM and CJS.
const __filename = typeof __dirname !== "undefined" ? "" : fileURLToPath(import.meta.url);
const __dirnameCompat = typeof __dirname !== "undefined" ? __dirname : dirname(__filename);

const EDUCATION_AUTH_FILE = join(
  __dirnameCompat,
  "tests/e2e/education/.auth/education-owner.json",
);

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: [
    /\.test\.ts$/,
    ...authenticatedBusinessLifecycleIgnore,
    ...authenticatedEducationLifecycleIgnore,
    ...mutatingE2EIgnore,
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: usesLocalWebServer && !skipWebServer
    ? {
        command: `npm run dev -- --host ${webServerHost} --port ${webServerPort} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,

  projects: [
    {
      name: "setup-education",
      testMatch: /education\/global-setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--ignore-certificate-errors"] },
      },
      dependencies: [],
    },
    {
      name: "education-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--ignore-certificate-errors"] },
        storageState: EDUCATION_AUTH_FILE,
      },
      testMatch:
        /education\/(education-setup|education-programs|education-leads|education-cookie-debug|education-network-debug|education-dashboard-debug)\.spec\.ts/,
    },
  ],
});
