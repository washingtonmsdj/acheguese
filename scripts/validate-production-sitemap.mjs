import fs from "node:fs";
import path from "node:path";

const CANONICAL_ORIGIN = "https://acheguese.com.br";
const REQUIRED_PATHS = [
  "/",
  "/inicio",
  "/ba/salvador",
  "/sobre",
  "/contato",
  "/termos",
  "/privacidade",
];
const NON_INDEXABLE_PREFIXES = [
  "/admin",
  "/central",
  "/conta",
  "/perfil",
  "/settings",
  "/notifications",
  "/notificacoes",
  "/mensagens",
  "/chat",
  "/login",
  "/cadastro",
  "/modal-auth",
  "/splash",
  "/onboarding",
  "/aceitar-termos",
  "/reset-password",
  "/checkout",
  "/planos",
];
const DISABLED_ROUTE_SEGMENTS = new Set(["mobilidade", "comunidade"]);

const target = process.argv[2] ?? "public";
if (!new Set(["public", "dist"]).has(target)) {
  throw new Error(`unsupported sitemap validation target: ${target}`);
}

const sitemapPath = path.resolve(target, "sitemap.xml");
const robotsPath = path.resolve(target, "robots.txt");

function readRequiredFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }

  const contents = fs.readFileSync(filePath, "utf8").trim();
  if (!contents) {
    throw new Error(`${label} is empty: ${filePath}`);
  }

  return contents;
}

const sitemap = readRequiredFile(sitemapPath, "sitemap");
const robots = readRequiredFile(robotsPath, "robots.txt");

if (/<!doctype\s+html|<html[\s>]/i.test(sitemap)) {
  throw new Error("sitemap contains HTML instead of XML");
}
if (!/^<\?xml\b/i.test(sitemap)) {
  throw new Error("sitemap is missing its XML declaration");
}
if (!/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["'][^>]*>/i.test(sitemap)) {
  throw new Error("sitemap is missing the canonical sitemap urlset namespace");
}
if (!/<\/urlset>\s*$/i.test(sitemap)) {
  throw new Error("sitemap does not close urlset");
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
if (urls.length < REQUIRED_PATHS.length) {
  throw new Error(`sitemap contains too few URLs: ${urls.length}`);
}

const uniqueUrls = new Set(urls);
if (uniqueUrls.size !== urls.length) {
  throw new Error("sitemap contains duplicate <loc> URLs");
}

for (const rawUrl of urls) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`sitemap contains an invalid URL: ${rawUrl}`);
  }

  if (url.origin !== CANONICAL_ORIGIN) {
    throw new Error(`non-canonical sitemap origin: ${rawUrl}`);
  }
  if (url.search || url.hash) {
    throw new Error(`sitemap URL must not contain query/hash: ${rawUrl}`);
  }
  if (url.username || url.password) {
    throw new Error(`sitemap URL must not contain credentials: ${rawUrl}`);
  }

  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const leakedPrefix = NON_INDEXABLE_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (leakedPrefix) {
    throw new Error(`non-indexable route leaked into sitemap: ${pathname}`);
  }

  const segments = pathname.split("/").filter(Boolean);
  const disabledSegment = segments.find((segment) => DISABLED_ROUTE_SEGMENTS.has(segment));
  if (disabledSegment) {
    throw new Error(`disabled route leaked into sitemap: ${pathname}`);
  }
}

for (const requiredPath of REQUIRED_PATHS) {
  const requiredUrl = new URL(requiredPath, CANONICAL_ORIGIN).toString();
  if (!uniqueUrls.has(requiredUrl)) {
    throw new Error(`required sitemap URL is missing: ${requiredUrl}`);
  }
}

if (/localhost|127\.0\.0\.1|ordax/i.test(sitemap)) {
  throw new Error("sitemap contains a non-production host or legacy marker");
}

if (!/^User-agent:\s*\*/im.test(robots)) {
  throw new Error("robots.txt is missing the wildcard user-agent");
}
if (!/^Allow:\s*\/\s*$/im.test(robots)) {
  throw new Error("robots.txt is missing Allow: /");
}
const sitemapDirective = `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`;
if (!robots.split(/\r?\n/).map((line) => line.trim()).includes(sitemapDirective)) {
  throw new Error(`robots.txt is missing canonical directive: ${sitemapDirective}`);
}
if (/localhost|127\.0\.0\.1|ordax/i.test(robots)) {
  throw new Error("robots.txt contains a non-production host or legacy marker");
}

console.log(`[sitemap] ${target}: valid (${urls.length} URLs)`);
