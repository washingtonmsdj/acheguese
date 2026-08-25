/**
 * Generate vercel.json from Security SSOT
 *
 * This script materializes Vercel security/cache headers from the canonical
 * security configuration without changing the production build contract.
 *
 * IMPORTANT:
 * - SECURITY_HEADERS and CACHE_HEADERS remain the SSOT.
 * - The production build command must stay on the guarded orchestrator.
 * - Do not hand-edit generated security headers in vercel.json.
 *
 * Usage:
 *   npx tsx scripts/generate-vercel-config.ts
 *
 * @security-critical
 */

import fs from "fs";
import path from "path";
import {
  SECURITY_HEADERS,
  CACHE_HEADERS,
  getSecurityConfigSummary,
} from "../src/config/security.config";

const VERCEL_CONFIG_TEMPLATE = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  buildCommand: "node scripts/run-vercel-production-build.mjs",
  outputDirectory: "dist",
  devCommand: "npm run dev",
  installCommand: "npm ci",
  framework: "vite",

  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html",
    },
  ],

  headers: [] as Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>,
};

function generateVercelConfig() {
  console.log("Generating vercel.json from security SSOT...");

  const summary = getSecurityConfigSummary();
  console.log(
    `Security SSOT ${summary.version}: ${summary.securityHeaders} headers, ${summary.cspDirectives} CSP directives.`,
  );

  const securityHeaders = Object.entries(SECURITY_HEADERS).map(
    ([key, value]) => ({
      key,
      value,
    }),
  );

  const cacheHeaders = Object.values(CACHE_HEADERS).map((config) => ({
    source: config.pattern,
    headers: Object.entries(config.headers).map(([key, value]) => ({
      key,
      value,
    })),
  }));

  const config = {
    ...VERCEL_CONFIG_TEMPLATE,
    headers: [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...cacheHeaders,
    ],
  };

  const outputPath = path.join(process.cwd(), "vercel.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);

  const generated = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
    buildCommand?: string;
    headers?: Array<{ headers?: Array<{ key?: string }> }>;
  };

  if (
    generated.buildCommand !==
    "node scripts/run-vercel-production-build.mjs"
  ) {
    throw new Error("Production build command drifted from guarded orchestrator");
  }

  const cspCount = (generated.headers ?? [])
    .flatMap((entry) => entry.headers ?? [])
    .filter((header) => header.key === "Content-Security-Policy").length;

  if (cspCount !== 1) {
    throw new Error(
      `Generated vercel.json must contain exactly one CSP header; found ${cspCount}`,
    );
  }

  console.log(`vercel.json generated successfully: ${outputPath}`);
}

try {
  generateVercelConfig();
} catch (error) {
  console.error("Failed to generate vercel.json from security SSOT:", error);
  process.exit(1);
}
