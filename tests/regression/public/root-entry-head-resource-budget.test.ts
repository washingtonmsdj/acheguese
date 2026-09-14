import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("public root head resource budget", () => {
  it("uses lightweight existing app icons instead of the heavy sidebar logo", () => {
    const html = read("index.html");
    const favicon = path.join(ROOT, "public/favicon.ico");
    const appleIcon = path.join(ROOT, "public/icon-192x192.png");
    const fullLogo = path.join(ROOT, "public/images/logo-icon.png");

    expect(html).toContain('rel="icon" href="/favicon.ico" sizes="any"');
    expect(html).toContain('rel="apple-touch-icon" href="/icon-192x192.png"');
    expect(html).not.toContain('href="/images/logo-icon.png"');

    expect(fs.statSync(favicon).size).toBeLessThanOrEqual(32_000);
    expect(fs.statSync(appleIcon).size).toBeLessThanOrEqual(16_000);
    expect(fs.statSync(fullLogo).size).toBeGreaterThan(100_000);
  });

  it("keeps the initial connection budget focused on OpenFreeMap", () => {
    const html = read("index.html");

    expect(html).toContain('rel="preconnect" href="https://tiles.openfreemap.org" crossorigin');
    expect(html).toContain('rel="dns-prefetch" href="//tiles.openfreemap.org"');
    expect(html).not.toContain("services6.arcgis.com");
    expect(html).not.toContain('rel="preconnect" href="https://fonts.googleapis.com"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.gstatic.com"');
  });

  it("does not precache the heavy sidebar logo during service-worker install", () => {
    const sw = read("public/sw.js");
    const staticAssetsBlock = sw.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/)?.[1] ?? "";

    expect(sw).toContain("const SW_VERSION = '2.0.4'");
    expect(staticAssetsBlock).not.toContain("/images/logo-icon.png");
    expect(staticAssetsBlock).toContain("/icon-192x192.png");
    expect(staticAssetsBlock).toContain("/icon-512x512.png");
    expect(sw).toContain("staleWhileRevalidate(request, CACHE_NAMES.images)");
  });
});