#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SECURITY_HEADERS } from "../../src/config/security.config";

const root = process.cwd();
const indexPath = resolve(root, "index.html");
const vercelPath = resolve(root, "vercel.json");
const errors: string[] = [];

type ScriptTag = {
  attributes: string;
  body: string;
  src?: string;
};

function extractAttribute(
  attributes: string,
  name: string,
): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = attributes.match(
    new RegExp(
      `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`,
      "i",
    ),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function parseScriptTags(html: string): ScriptTag[] {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(
    (match) => ({
      attributes: match[1],
      body: match[2],
      src: extractAttribute(match[1], "src"),
    }),
  );
}

function parseCsp(value: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const section of value.split(";")) {
    const tokens = section.trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) directives.set(tokens[0], tokens.slice(1));
  }
  return directives;
}

function sha256Source(body: string): string {
  return `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;
}

function sourceAllowsUrl(source: string, rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (!source.startsWith("http://") && !source.startsWith("https://"))
    return false;

  const wildcard = source.match(/^(https?):\/\/\*\.([^/:]+)(?::(\d+))?$/i);
  if (wildcard) {
    const [, protocol, parentHost, port] = wildcard;
    return (
      url.protocol === `${protocol}:` &&
      url.hostname.endsWith(`.${parentHost}`) &&
      (!port || url.port === port)
    );
  }

  try {
    return new URL(source).origin === url.origin;
  } catch {
    return false;
  }
}

function localScriptPath(src: string): string | undefined {
  if (!src.startsWith("/") || src.startsWith("//")) return undefined;
  const pathname = src.split(/[?#]/, 1)[0];
  return pathname.startsWith("/src/")
    ? resolve(root, pathname.slice(1))
    : resolve(root, "public", pathname.slice(1));
}

const html = readFileSync(indexPath, "utf8");
const vercelConfig = JSON.parse(readFileSync(vercelPath, "utf8")) as {
  headers?: Array<{ headers?: Array<{ key?: string; value?: string }> }>;
};

const cspHeaders = (vercelConfig.headers ?? [])
  .flatMap((entry) => entry.headers ?? [])
  .filter((header) => header.key?.toLowerCase() === "content-security-policy");

if (cspHeaders.length !== 1 || !cspHeaders[0]?.value) {
  errors.push(
    `vercel.json deve conter exatamente um header Content-Security-Policy; encontrados: ${cspHeaders.length}`,
  );
}

const deployedCsp = cspHeaders[0]?.value ?? "";
const ssotCsp = SECURITY_HEADERS["Content-Security-Policy"];
if (deployedCsp !== ssotCsp) {
  errors.push(
    "CSP de vercel.json diverge do SSOT src/config/security.config.ts",
  );
}

const directives = parseCsp(deployedCsp);
const scriptSources =
  directives.get("script-src") ?? directives.get("default-src") ?? [];

if (scriptSources.includes("'unsafe-inline'")) {
  errors.push("script-src de produção não pode conter 'unsafe-inline'");
}

const scriptTags = parseScriptTags(html);
const inlineScripts = scriptTags.filter(
  (script) => !script.src && script.body.trim().length > 0,
);
const inlineHashes = new Set(
  inlineScripts.map((script) => sha256Source(script.body)),
);
const configuredHashes = new Set(
  scriptSources.filter((source) => /^'sha256-[A-Za-z0-9+/]+=*'$/.test(source)),
);

for (const hash of inlineHashes) {
  if (!configuredHashes.has(hash))
    errors.push(`script inline sem hash CSP correspondente: ${hash}`);
}

for (const hash of configuredHashes) {
  if (!inlineHashes.has(hash))
    errors.push(
      `hash CSP obsoleto ou sem script inline correspondente: ${hash}`,
    );
}

if (/\son[a-z]+\s*=/i.test(html)) {
  errors.push("handler JavaScript inline detectado no index.html");
}

if (/\bjavascript\s*:/i.test(html)) {
  errors.push("URL javascript: detectada no index.html");
}

const dynamicExternalUrls = new Set<string>();
for (const script of scriptTags.filter((entry) => entry.src)) {
  const src = script.src as string;
  if (src.startsWith("/") && !src.startsWith("//")) {
    if (!scriptSources.includes("'self'"))
      errors.push(`script same-origin não autorizado por script-src: ${src}`);
    const filePath = localScriptPath(src);
    if (!filePath || !existsSync(filePath)) {
      errors.push(`arquivo de script same-origin ausente: ${src}`);
      continue;
    }

    const source = readFileSync(filePath, "utf8");
    for (const match of source.matchAll(
      /\.src\s*=\s*["'](https?:\/\/[^"']+)["']/g,
    )) {
      dynamicExternalUrls.add(match[1]);
    }
    continue;
  }

  if (!scriptSources.some((source) => sourceAllowsUrl(source, src))) {
    errors.push(`script externo não autorizado por script-src: ${src}`);
  }
}

for (const url of dynamicExternalUrls) {
  if (!scriptSources.some((source) => sourceAllowsUrl(source, url))) {
    errors.push(
      `script injetado em runtime não autorizado por script-src: ${new URL(url).origin}`,
    );
  }
}

if (errors.length > 0) {
  console.error("FAIL: validação CSP encontrou inconsistências:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `PASS: CSP sincronizada; ${scriptTags.length} scripts analisados, ${inlineScripts.length} inline, ${dynamicExternalUrls.size} origem dinâmica validada.`,
);
