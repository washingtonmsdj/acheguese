#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, posix, resolve } from "node:path";

const ROOT = process.cwd();
const PACKAGE_PATH = resolve(ROOT, "package.json");
const IGNORE_PATH = resolve(ROOT, ".vercelignore");
const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, "utf8"));
const errors = [];
const criticalInputs = new Map();
const visitedImports = new Set();

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function relativeToRoot(filePath) {
  const absolute = resolve(ROOT, filePath);
  const relative = normalizePath(
    absolute.slice(ROOT.length).replace(/^[/\\]/, ""),
  );
  if (
    !relative ||
    absolute === ROOT ||
    absolute.startsWith(`${ROOT}\\`) ||
    absolute.startsWith(`${ROOT}/`)
  ) {
    return relative;
  }
  errors.push(`caminho crítico fora da raiz do projeto: ${filePath}`);
  return undefined;
}

function resolveLocalImport(fromFile, specifier) {
  const base = resolve(dirname(resolve(ROOT, fromFile)), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.json`,
    resolve(base, "index.ts"),
    resolve(base, "index.tsx"),
    resolve(base, "index.js"),
    resolve(base, "index.mjs"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function addCriticalInput(filePath, reason, followImports = false) {
  const relative = relativeToRoot(filePath);
  if (relative === undefined) return;
  if (!criticalInputs.has(relative)) criticalInputs.set(relative, new Set());
  criticalInputs.get(relative).add(reason);

  const absolute = resolve(ROOT, relative);
  if (
    !followImports ||
    visitedImports.has(relative) ||
    !existsSync(absolute) ||
    statSync(absolute).isDirectory()
  )
    return;
  visitedImports.add(relative);

  const extension = extname(relative);
  if (![".js", ".mjs", ".cjs", ".ts", ".tsx"].includes(extension)) return;

  const source = readFileSync(absolute, "utf8");
  const importPatterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?["'](\.{1,2}\/[^"']+)["']/g,
    /require\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g,
  ];
  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const imported = resolveLocalImport(relative, match[1]);
      if (imported)
        addCriticalInput(imported, `import local de ${relative}`, true);
    }
  }
}

function shellToken(value) {
  return value?.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
}

const visitedScripts = new Set();
const visitingScripts = new Set();
const resolvedScripts = [];

function visitNpmScript(name) {
  if (visitedScripts.has(name)) return;
  if (visitingScripts.has(name)) {
    errors.push(
      `ciclo detectado na cadeia npm: ${[...visitingScripts, name].join(" -> ")}`,
    );
    return;
  }

  const command = packageJson.scripts?.[name];
  if (typeof command !== "string" || !command.trim()) {
    errors.push(`script npm referenciado mas ausente: ${name}`);
    return;
  }

  visitingScripts.add(name);
  resolvedScripts.push({ name, command });
  for (const match of command.matchAll(
    /\bnpm(?:\.cmd)?\s+run(?:-script)?\s+([A-Za-z0-9:_-]+)/g,
  )) {
    visitNpmScript(match[1]);
  }
  visitingScripts.delete(name);
  visitedScripts.add(name);
}

visitNpmScript("build:vercel");

addCriticalInput("package.json", "define a cadeia build:vercel");
addCriticalInput("package-lock.json", "lockfile usado por npm ci");
addCriticalInput("vercel.json", "configura o build remoto");
addCriticalInput(".vercelignore", "define o pacote de fontes enviado");

for (const { name, command } of resolvedScripts) {
  for (const match of command.matchAll(
    /(?:^|\s)(?:node|tsx)\s+("[^"]+"|'[^']+'|[^\s&|;]+)/g,
  )) {
    const entry = shellToken(match[1]);
    if (entry && !entry.startsWith("-"))
      addCriticalInput(entry, `entrypoint de npm run ${name}`, true);
  }

  if (/(?:^|\s)tsc(?:\s|$)/.test(command)) {
    const project = command.match(
      /(?:^|\s)(?:-p|--project)\s+("[^"]+"|'[^']+'|[^\s&|;]+)/,
    )?.[1];
    addCriticalInput(
      shellToken(project) ?? "tsconfig.json",
      `configuração TypeScript de npm run ${name}`,
    );
  }

  if (/(?:^|\s)eslint(?:\s|$)/.test(command)) {
    addCriticalInput(
      "eslint.config.js",
      `configuração ESLint de npm run ${name}`,
      true,
    );
    for (const match of command.matchAll(/(?:^|\s)(src|api)(?=\s|$)/g)) {
      addCriticalInput(match[1], `alvo ESLint de npm run ${name}`);
    }
  }

  if (/(?:^|\s)vite\s+build(?:\s|$)/.test(command)) {
    addCriticalInput(
      "vite.config.ts",
      `configuração Vite de npm run ${name}`,
      true,
    );
    addCriticalInput("index.html", `entrada HTML de npm run ${name}`);
    addCriticalInput("src/main.tsx", `entrada da aplicação de npm run ${name}`);
    addCriticalInput("public", `assets públicos de npm run ${name}`);
  }
}

if (existsSync(resolve(ROOT, "index.html"))) {
  const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
  for (const match of html.matchAll(
    /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>\u0060]+))[^>]*>/gi,
  )) {
    const src = match[1] ?? match[2] ?? match[3];
    if (!src?.startsWith("/") || src.startsWith("//")) continue;
    const pathname = src.split(/[?#]/, 1)[0];
    addCriticalInput(
      pathname.startsWith("/src/")
        ? pathname.slice(1)
        : posix.join("public", pathname.slice(1)),
      `script same-origin referenciado por index.html`,
    );
  }
}

function globToRegex(glob) {
  let regex = "";
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === "*") {
      if (glob[index + 1] === "*") {
        index += 1;
        if (glob[index + 1] === "/") {
          index += 1;
          regex += "(?:.*/)?";
        } else {
          regex += ".*";
        }
      } else {
        regex += "[^/]*";
      }
    } else if (character === "?") {
      regex += "[^/]";
    } else {
      regex += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`^${regex}$`);
}

function parseIgnoreRules(source) {
  const rules = [];
  for (const rawLine of source.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const negated = line.startsWith("!");
    if (negated) line = line.slice(1);
    if (!line) continue;
    if (line.includes("["))
      errors.push(
        `padrão .vercelignore não suportado pelo validador: ${rawLine}`,
      );
    const anchored = line.startsWith("/");
    if (anchored) line = line.slice(1);
    const directoryOnly = line.endsWith("/");
    if (directoryOnly) line = line.slice(0, -1);
    const normalized = normalizePath(line);
    rules.push({
      negated,
      anchored,
      directoryOnly,
      hasSlash: normalized.includes("/"),
      regex: globToRegex(normalized),
      raw: rawLine,
    });
  }
  return rules;
}

function ruleMatches(rule, filePath, isDirectory) {
  const segments = filePath.split("/");
  if (!rule.anchored && !rule.hasSlash) {
    const limit =
      rule.directoryOnly && !isDirectory
        ? segments.length - 1
        : segments.length;
    return segments.slice(0, limit).some((segment) => rule.regex.test(segment));
  }

  const candidates = [filePath];
  for (let index = 1; index < segments.length; index += 1) {
    candidates.push(segments.slice(0, index).join("/"));
  }
  return candidates.some((candidate) => rule.regex.test(candidate));
}

const ignoreRules = parseIgnoreRules(readFileSync(IGNORE_PATH, "utf8"));

function ignoredByVercel(filePath, isDirectory) {
  let ignored = false;
  for (const rule of ignoreRules) {
    if (ruleMatches(rule, filePath, isDirectory)) ignored = !rule.negated;
  }
  return ignored;
}

for (const [filePath, reasons] of [...criticalInputs.entries()].sort(
  ([left], [right]) => left.localeCompare(right),
)) {
  const absolute = resolve(ROOT, filePath);
  if (!existsSync(absolute)) {
    errors.push(
      `input crítico ausente: ${filePath} (${[...reasons].join("; ")})`,
    );
    continue;
  }
  if (ignoredByVercel(filePath, statSync(absolute).isDirectory())) {
    errors.push(
      `input crítico excluído por .vercelignore: ${filePath} (${[...reasons].join("; ")})`,
    );
  }
}

if (errors.length > 0) {
  console.error("FAIL: inputs do build remoto não estão íntegros:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `PASS: ${criticalInputs.size} inputs críticos derivados de ${resolvedScripts.length} scripts npm estão disponíveis para o build Vercel.`,
);
