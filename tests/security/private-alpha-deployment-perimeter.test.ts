import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readReleasePolicy,
  shouldServeClosedProduction,
} from "../../deployment/build.mjs";

const root = process.cwd();

describe("private alpha deployment perimeter", () => {
  it("keeps the public production environment closed", () => {
    const policy = readReleasePolicy();

    expect(policy).toMatchObject({
      stage: "private-alpha",
      productionExposure: "closed",
      alphaExposure: "vercel-authenticated-preview",
      publicLaunchApproved: false,
    });
    expect(
      shouldServeClosedProduction({ VERCEL_ENV: "production" }, policy),
    ).toBe(true);
    expect(
      shouldServeClosedProduction({ VERCEL_TARGET_ENV: "production" }, policy),
    ).toBe(true);
  });

  it("builds the application for protected preview and local validation", () => {
    const policy = readReleasePolicy();

    expect(shouldServeClosedProduction({ VERCEL_ENV: "preview" }, policy)).toBe(
      false,
    );
    expect(shouldServeClosedProduction({}, policy)).toBe(false);
  });

  it("does not place redirects, scripts, forms, or indexing on the closed page", () => {
    const html = readFileSync(
      path.join(root, "deployment", "private-alpha.html"),
      "utf8",
    );

    expect(html).toContain(
      'name="robots" content="noindex, nofollow, noarchive"',
    );
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/http-equiv=["']refresh/i);
  });

  it("keeps generated and committed Vercel build commands aligned", () => {
    const vercel = JSON.parse(
      readFileSync(path.join(root, "vercel.json"), "utf8"),
    );
    const generator = readFileSync(
      path.join(root, "scripts", "generate-vercel-config.ts"),
      "utf8",
    );

    expect(vercel.buildCommand).toBe("npm run build:vercel");
    expect(generator).toMatch(/buildCommand:\s*["']npm run build:vercel["']/);
  });

  it("keeps alpha monitoring pseudonymous and strips request payloads", () => {
    const sentryConfig = readFileSync(
      path.join(root, "src", "shared", "config", "sentry.config.ts"),
      "utf8",
    );

    expect(sentryConfig).toContain("sendDefaultPii: false");
    expect(sentryConfig).toContain("delete event.request.data");
    expect(sentryConfig).toContain("delete event.request.query_string");
    expect(sentryConfig).toContain("VITE_SENTRY_ENVIRONMENT");
    expect(sentryConfig).not.toMatch(/Sentry\.setUser\(\{[^}]*email/s);
  });
});
