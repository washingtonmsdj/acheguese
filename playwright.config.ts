import { dirname, join } from "path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";

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

// Compatible with ESM and CJS.
const __filename = typeof __dirname !== "undefined" ? "" : fileURLToPath(import.meta.url);
const __dirnameCompat = typeof __dirname !== "undefined" ? __dirname : dirname(__filename);

const EDUCATION_AUTH_FILE = join(
  __dirnameCompat,
  "tests/e2e/education/.auth/education-owner.json",
);

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: /\.test\.ts$/,
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
