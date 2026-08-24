import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const TARGET_DIR = process.argv[2]?.trim() || "public";
const SITEMAP_PATH = resolve(process.cwd(), TARGET_DIR, "sitemap.xml");
const ROBOTS_PATH = resolve(process.cwd(), TARGET_DIR, "robots.txt");
const CANONICAL_ORIGIN = "https://acheguese.com.br";
const CANONICAL_SITEMAP_URL = `${CANONICAL_ORIGIN}/sitemap.xml`;
const REQUIRED_URLS = [
  CANONICAL_ORIGIN,
  `${CANONICAL_ORIGIN}/inicio`,
  `${CANONICAL_ORIGIN}/ba/salvador`,
  `${CANONICAL_ORIGIN}/sobre`,
  `${CANONICAL_ORIGIN}/contato`,
  `${CANONICAL_ORIGIN}/termos`,
  `${CANONICAL_ORIGIN}/privacidade`,
];

function fail(message) {
  console.error(`[validate-production-sitemap:${TARGET_DIR}] ${message}`);
  process.exit(1);
}

async function readRequiredFile(path, label) {
  try {
    const content = await readFile(path, "utf8");
    if (!content.trim()) fail(`${label} is empty`);
    return content;
  } catch (error) {
    fail(`unable to read ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const xml = await readRequiredFile(SITEMAP_PATH, "sitemap.xml");
const trimmed = xml.trim();

if (!trimmed.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  fail("sitemap.xml is missing the expected XML declaration");
}
if (!trimmed.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
  fail("sitemap.xml is missing the canonical sitemap urlset namespace");
}
if (!trimmed.endsWith("</urlset>")) fail("sitemap.xml has no closing urlset");

const locs = [...trimmed.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]?.trim());
if (locs.length < REQUIRED_URLS.length) {
  fail(`sitemap.xml contains only ${locs.length} URLs; expected at least ${REQUIRED_URLS.length}`);
}

for (const requiredUrl of REQUIRED_URLS) {
  if (!locs.includes(requiredUrl)) fail(`missing required canonical URL: ${requiredUrl}`);
}

const invalidUrls = locs.filter((loc) => {
  try {
    const url = new URL(loc);
    return url.origin !== CANONICAL_ORIGIN || Boolean(url.search) || Boolean(url.hash);
  } catch {
    return true;
  }
});
if (invalidUrls.length > 0) {
  fail(`non-canonical or invalid sitemap URLs found: ${invalidUrls.slice(0, 5).join(", ")}`);
}

if (/localhost|127\.0\.0\.1|ordax\.com\.br/i.test(trimmed)) {
  fail("development or stale OrdaX host leaked into sitemap.xml");
}

if (new Set(locs).size !== locs.length) fail("duplicate <loc> entries found in sitemap.xml");

const robots = await readRequiredFile(ROBOTS_PATH, "robots.txt");
if (!/^User-agent:\s*\*/im.test(robots)) fail("robots.txt has no default user-agent policy");
if (!/^Allow:\s*\/$/im.test(robots)) fail("robots.txt does not allow the public root");

const sitemapDirectives = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((match) => match[1]);
if (sitemapDirectives.length !== 1) {
  fail(`robots.txt must contain exactly one Sitemap directive; found ${sitemapDirectives.length}`);
}
if (sitemapDirectives[0] !== CANONICAL_SITEMAP_URL) {
  fail(`robots.txt points to a non-canonical sitemap: ${sitemapDirectives[0]}`);
}
if (/localhost|127\.0\.0\.1|ordax\.com\.br/i.test(robots)) {
  fail("development or stale OrdaX host leaked into robots.txt");
}

console.log(
  `[validate-production-sitemap:${TARGET_DIR}] PASS (${locs.length} canonical URLs; robots -> ${CANONICAL_SITEMAP_URL})`,
);
