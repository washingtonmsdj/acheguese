import fs from "node:fs";
import path from "node:path";

const CANONICAL_ORIGIN = "https://acheguese.com.br";
const SITEMAP_MAX_URLS = 50_000;
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
const SITEMAP_INDEX_MAX_ENTRIES = 50_000;
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

const targetRoot = path.resolve(target);
const sitemapPath = path.resolve(targetRoot, "sitemap.xml");
const robotsPath = path.resolve(targetRoot, "robots.txt");

function readRequiredFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }

  const size = fs.statSync(filePath).size;
  if (size > SITEMAP_MAX_BYTES && label.startsWith("sitemap")) {
    throw new Error(`${label} exceeds 50MB uncompressed: ${size} bytes`);
  }

  const contents = fs.readFileSync(filePath, "utf8").trim();
  if (!contents) {
    throw new Error(`${label} is empty: ${filePath}`);
  }

  return contents;
}

function assertXmlEnvelope(contents, rootElement, label) {
  if (/<!doctype\s+html|<html[\s>]/i.test(contents)) {
    throw new Error(`${label} contains HTML instead of XML`);
  }
  if (!/^<\?xml\b/i.test(contents)) {
    throw new Error(`${label} is missing its XML declaration`);
  }
  if (
    !new RegExp(
      `<${rootElement}\\b[^>]*xmlns=["']http:\\/\\/www\\.sitemaps\\.org\\/schemas\\/sitemap\\/0\\.9["'][^>]*>`,
      "i",
    ).test(contents)
  ) {
    throw new Error(`${label} is missing the canonical sitemap namespace`);
  }
  if (!new RegExp(`</${rootElement}>\\s*$`, "i").test(contents)) {
    throw new Error(`${label} does not close ${rootElement}`);
  }
}

function extractLocUrls(contents) {
  return [...contents.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].trim(),
  );
}

function parseUrlset(contents, label) {
  assertXmlEnvelope(contents, "urlset", label);
  const urls = extractLocUrls(contents);
  if (urls.length > SITEMAP_MAX_URLS) {
    throw new Error(`${label} exceeds the 50,000 URL protocol limit: ${urls.length}`);
  }
  return urls;
}

function parseCanonicalUrl(rawUrl, label) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${label} contains an invalid URL: ${rawUrl}`);
  }

  if (url.origin !== CANONICAL_ORIGIN) {
    throw new Error(`${label} contains non-canonical origin: ${rawUrl}`);
  }
  if (url.search || url.hash) {
    throw new Error(`${label} URL must not contain query/hash: ${rawUrl}`);
  }
  if (url.username || url.password) {
    throw new Error(`${label} URL must not contain credentials: ${rawUrl}`);
  }
  if (/localhost|127\.0\.0\.1|ordax/i.test(rawUrl)) {
    throw new Error(`${label} contains a non-production host or legacy marker: ${rawUrl}`);
  }

  return url;
}

function resolveIndexedSitemap(rawUrl) {
  const url = parseCanonicalUrl(rawUrl, "sitemap index");
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const localPath = path.resolve(targetRoot, relativePath);
  if (
    !relativePath ||
    !relativePath.endsWith(".xml") ||
    localPath === sitemapPath ||
    (localPath !== targetRoot && !localPath.startsWith(`${targetRoot}${path.sep}`))
  ) {
    throw new Error(`sitemap index references an invalid local child: ${rawUrl}`);
  }
  return localPath;
}

function readSitemapUrls() {
  const rootSitemap = readRequiredFile(sitemapPath, "sitemap root");

  if (/<sitemapindex\b/i.test(rootSitemap)) {
    assertXmlEnvelope(rootSitemap, "sitemapindex", "sitemap root");
    const indexedUrls = extractLocUrls(rootSitemap);
    if (indexedUrls.length === 0) {
      throw new Error("sitemap index contains no child sitemaps");
    }
    if (indexedUrls.length > SITEMAP_INDEX_MAX_ENTRIES) {
      throw new Error(
        `sitemap index exceeds the 50,000 entry protocol limit: ${indexedUrls.length}`,
      );
    }
    if (new Set(indexedUrls).size !== indexedUrls.length) {
      throw new Error("sitemap index contains duplicate child URLs");
    }

    const urls = [];
    for (const indexedUrl of indexedUrls) {
      const childPath = resolveIndexedSitemap(indexedUrl);
      const childLabel = `sitemap child ${path.basename(childPath)}`;
      const child = readRequiredFile(childPath, childLabel);
      urls.push(...parseUrlset(child, childLabel));
    }

    return { urls, indexedFiles: indexedUrls.length };
  }

  return { urls: parseUrlset(rootSitemap, "sitemap root"), indexedFiles: 0 };
}

const { urls, indexedFiles } = readSitemapUrls();
const robots = readRequiredFile(robotsPath, "robots.txt");

if (urls.length < REQUIRED_PATHS.length) {
  throw new Error(`sitemap contains too few URLs: ${urls.length}`);
}

const uniqueUrls = new Set(urls);
const canonicalPaths = new Set();
if (uniqueUrls.size !== urls.length) {
  throw new Error("sitemap set contains duplicate <loc> URLs across files");
}

for (const rawUrl of urls) {
  const url = parseCanonicalUrl(rawUrl, "sitemap");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  canonicalPaths.add(pathname);

  const leakedPrefix = NON_INDEXABLE_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (leakedPrefix) {
    throw new Error(`non-indexable route leaked into sitemap: ${pathname}`);
  }

  const segments = pathname.split("/").filter(Boolean);
  const disabledSegment = segments.find((segment) =>
    DISABLED_ROUTE_SEGMENTS.has(segment),
  );
  if (disabledSegment) {
    throw new Error(`disabled route leaked into sitemap: ${pathname}`);
  }
}

for (const requiredPath of REQUIRED_PATHS) {
  const normalizedRequiredPath = requiredPath.replace(/\/+$/, "") || "/";
  if (!canonicalPaths.has(normalizedRequiredPath)) {
    throw new Error(`required sitemap path is missing: ${normalizedRequiredPath}`);
  }
}

if (!/^User-agent:\s*\*/im.test(robots)) {
  throw new Error("robots.txt is missing the wildcard user-agent");
}
if (!/^Allow:\s*\/\s*$/im.test(robots)) {
  throw new Error("robots.txt is missing Allow: /");
}
const sitemapDirective = `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`;
if (
  !robots
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(sitemapDirective)
) {
  throw new Error(`robots.txt is missing canonical directive: ${sitemapDirective}`);
}
if (/localhost|127\.0\.0\.1|ordax/i.test(robots)) {
  throw new Error("robots.txt contains a non-production host or legacy marker");
}

console.log(
  indexedFiles > 0
    ? `[sitemap] ${target}: valid index (${indexedFiles} files, ${urls.length} URLs)`
    : `[sitemap] ${target}: valid (${urls.length} URLs)`,
);
