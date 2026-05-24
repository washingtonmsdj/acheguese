#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import {
  CRITICAL_SHARED_COMPONENTS,
  DOC_OBSERVATIONS,
  DOMAIN_REGISTRY,
  GOVERNANCE_ALLOWED_DB_PATH_MARKERS,
} from "./lib/architecture-registry";

interface RouteEntry {
  path: string;
  component: string | null;
  file: string | null;
  domain: string | null;
}

interface DomainInventory {
  domain: string;
  services: string[];
  pages: string[];
  routes: string[];
  tables: string[];
  rpcs: string[];
  officialHooks: string[];
  legacyHooks: string[];
  legacyFiles: string[];
  docs: string[];
  directDbOutsideServices: string[];
  crossModuleImports: string[];
  duplicatedServices: string[];
  duplicatedTypes: string[];
}

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const DOCS_DIR = path.join(ROOT, "docs");
const OUTPUT_DIR = path.join(DOCS_DIR, "audits");
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const HOOK_FILE_RE = /\/hooks\/use[A-Z0-9].*\.(ts|tsx)$/;
const PAGE_FILE_RE = /\/pages\/.*\.(ts|tsx)$/;
const TABLE_RE = /\.from\(\s*['"]([a-zA-Z0-9_:-]+)['"]\s*\)/g;
const TABLE_CONSTANTS_RE = /\b[A-Z0-9_]+_TABLES\s*=\s*\{([\s\S]*?)\}\s*as const/g;
const TABLE_CONSTANT_VALUE_RE = /:\s*["']([a-zA-Z0-9_:-]+)["']/g;
const RPC_RE = /\.rpc\(\s*['"]([a-zA-Z0-9_:-]+)['"]\s*/g;
const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const SUPABASE_BOUNDARY_RE =
  /(\(\s*supabase\s+as\s+any\s*\)|\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(|from\s+['"]@\/integrations\/supabase(?:\/client)?['"])/;
const SERVICE_FILE_RE = /(?:^|\/)([^/]+Service(?:\.impl)?\.ts)$/i;
const LEGACY_RE = /(legacy|legado|deprecated|compat|__mocks__|mock|old)/i;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function relativeToRoot(filePath: string): string {
  return normalize(path.relative(ROOT, filePath));
}

function walk(dir: string, includeMarkdown = false): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", "coverage"].includes(entry.name)) {
        continue;
      }
      files.push(...walk(fullPath, includeMarkdown));
      continue;
    }

    if (
      entry.isFile() &&
      (CODE_FILE_RE.test(entry.name) || (includeMarkdown && /\.(md|mdx|sql)$/i.test(entry.name)))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractMatches(content: string, regex: RegExp): string[] {
  return Array.from(content.matchAll(regex)).map((match) => match[1]);
}

function extractTableConstants(content: string): string[] {
  return Array.from(content.matchAll(TABLE_CONSTANTS_RE)).flatMap((match) =>
    Array.from(match[1].matchAll(TABLE_CONSTANT_VALUE_RE)).map((valueMatch) => valueMatch[1]),
  );
}

function hasAllowedDbMarker(filePath: string): boolean {
  const normalized = normalize(filePath);
  return GOVERNANCE_ALLOWED_DB_PATH_MARKERS.some((marker) => normalized.includes(marker));
}

function stripInlineComment(line: string): string {
  const index = line.indexOf("//");
  return index >= 0 ? line.slice(0, index) : line;
}

function stripBlockComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, "");
}

function resolveImport(currentFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const resolved = path.resolve(path.dirname(currentFile), specifier);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    path.join(resolved, "index.ts"),
    path.join(resolved, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return normalize(candidate);
  }
  return null;
}

function collectAllSourceFiles(): string[] {
  return walk(SRC_DIR);
}

function collectServiceGroups(files: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const file of files) {
    const relativeFile = relativeToRoot(file);
    const match = relativeFile.match(SERVICE_FILE_RE);
    if (!match) continue;
    const serviceBase = match[1].replace(".impl.ts", ".ts");
    grouped.set(serviceBase, [...(grouped.get(serviceBase) ?? []), relativeFile]);
  }
  return grouped;
}

function collectTypeGroups(files: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const file of files) {
    const relativeFile = relativeToRoot(file);
    if (!relativeFile.includes("/types/")) continue;
    const baseName = path.basename(relativeFile);
    if (baseName === "index.ts" || baseName === "types.ts") continue;
    grouped.set(baseName, [...(grouped.get(baseName) ?? []), relativeFile]);
  }
  return grouped;
}

function extractImports(content: string): string[] {
  return Array.from(content.matchAll(IMPORT_RE)).map((match) => match[1]);
}

function parseComponentImports(appContent: string): Map<string, string> {
  const componentMap = new Map<string, string>();
  const appFile = path.join(ROOT, "src", "App.tsx");

  function normalizeImportTarget(filePath: string): string {
    if (filePath.startsWith("@/")) {
      return normalize(path.join("src", filePath.slice(2)));
    }
    if (filePath.startsWith(".")) {
      const resolved = path.resolve(path.dirname(appFile), filePath);
      const candidates = [
        resolved,
        `${resolved}.ts`,
        `${resolved}.tsx`,
        `${resolved}.js`,
        `${resolved}.jsx`,
        path.join(resolved, "index.ts"),
        path.join(resolved, "index.tsx"),
      ];
      const existing = candidates.find((candidate) => fs.existsSync(candidate));
      return existing ? relativeToRoot(existing) : normalize(filePath);
    }
    return normalize(filePath);
  }

  const importRegex = /^import\s+(\w+|\{[^}]+\})\s+from\s+["']([^"']+)["'];?/gm;
  for (const match of appContent.matchAll(importRegex)) {
    const imported = match[1];
    const filePath = normalizeImportTarget(match[2]);
    if (imported.startsWith("{")) {
      imported
        .replace(/[{}]/g, "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const [name, alias] = part.split(/\s+as\s+/);
          componentMap.set((alias ?? name).trim(), filePath);
        });
      continue;
    }
    componentMap.set(imported.trim(), filePath);
  }

  const lazyRegex = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)/g;
  for (const match of appContent.matchAll(lazyRegex)) {
    componentMap.set(match[1], normalizeImportTarget(match[2]));
  }

  return componentMap;
}

function joinRouteSegments(stack: string[], currentPath?: string): string {
  if (!currentPath) {
    return stack.filter(Boolean).join("/") || "/";
  }
  if (currentPath.startsWith("/")) {
    return currentPath;
  }
  const parts = [...stack.filter(Boolean), currentPath];
  return `/${parts.join("/")}`.replace(/\/+/g, "/");
}

function parseRoutes(): RouteEntry[] {
  const appFile = path.join(ROOT, "src", "App.tsx");
  const appContent = fs.readFileSync(appFile, "utf-8");
  const componentMap = parseComponentImports(appContent);
  const routes: RouteEntry[] = [];
  const stack: string[] = [];

  for (const rawLine of appContent.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("</Route>")) {
      stack.pop();
      continue;
    }

    if (!line.startsWith("<Route")) continue;
    const pathMatch = line.match(/path="([^"]+)"/);
    const elementMatch = line.match(/element={<([A-Za-z0-9_]+)/);
    const isSelfClosing = line.includes("/>");
    const routePath = joinRouteSegments(stack, pathMatch?.[1]);
    const component = elementMatch?.[1] ?? null;
    const file = component ? componentMap.get(component) ?? null : null;

    if (pathMatch) {
      routes.push({
        path: routePath,
        component,
        file,
        domain: null,
      });
    }

    if (!isSelfClosing) {
      stack.push(pathMatch?.[1] ?? "");
    }
  }

  return routes;
}

function inferDomainFromRoute(route: RouteEntry): string | null {
  const routePath = route.path;
  const normalizedFile = route.file ? normalize(route.file) : null;

  const prefixChecks: Array<[string, string]> = [
    ["/admin", "admin"],
    ["/mobilidade", "mobility"],
    ["/track/", "mobility"],
    ["/classificados", "classifieds"],
    ["/classificado", "classifieds"],
    ["/c/", "classifieds"],
    ["/gastronomia", "gastronomy"],
    ["/services", "professionals-services"],
    ["/servicos", "professionals-services"],
    ["/profissionais", "professionals-services"],
    ["/vagas", "professionals-services"],
    ["/comunidade/:state/:city/:territorySlug", "community-feed"],
    ["/recomendacoes", "community-recommendations"],
    ["/achados-perdidos", "community-lost-found"],
    ["/eventos", "community-events"],
    ["/grupos", "community-groups"],
    ["/mapa", "map"],
    ["/perto-de-mim", "map"],
    ["/pontos-turisticos", "map"],
    ["/perfil", "profile"],
    ["/profile", "profile"],
    ["/u/", "profile"],
    ["/p/", "profile"],
    ["/br", "core-routing-location-public-identity"],
    ["/brasil", "core-routing-location-public-identity"],
  ];

  for (const [prefix, domainId] of prefixChecks) {
    if (routePath === prefix || routePath.startsWith(prefix)) {
      if (routePath === "/p/:slug" && route.component === "BusinessPremiumRoute") {
        return "business";
      }
      return domainId;
    }
  }

  if (normalizedFile) {
    for (const domain of DOMAIN_REGISTRY) {
      if (domain.sourceRoots.some((rootDir) => normalizedFile.startsWith(rootDir))) {
        return domain.id;
      }
    }
  }

  return null;
}

function normalizeRouteEntry(route: RouteEntry): RouteEntry {
  if (
    route.file?.startsWith("src/modules/admin/pages/") &&
    route.path !== "/admin" &&
    !route.path.startsWith("/admin/")
  ) {
    return {
      ...route,
      path: `/admin${route.path === "/" ? "" : route.path}`,
    };
  }

  return route;
}

function collectDomainInventory(): DomainInventory[] {
  const allFiles = collectAllSourceFiles();
  const serviceGroups = collectServiceGroups(allFiles);
  const typeGroups = collectTypeGroups(allFiles);
  const routes = parseRoutes()
    .map(normalizeRouteEntry)
    .map((route) => ({
      ...route,
      domain: inferDomainFromRoute(route),
    }));

  return DOMAIN_REGISTRY.map((domain) => {
    const domainFiles = allFiles.filter((file) => {
      const relativeFile = relativeToRoot(file);
      return domain.sourceRoots.some((rootDir) => relativeFile.startsWith(normalize(rootDir)));
    });

    const services = domainFiles
      .map(relativeToRoot)
      .filter((file) => file.includes("/services/") || SERVICE_FILE_RE.test(file))
      .sort();

    const pages = domainFiles
      .map(relativeToRoot)
      .filter((file) => PAGE_FILE_RE.test(file))
      .sort();

    const hooks = domainFiles.map(relativeToRoot).filter((file) => HOOK_FILE_RE.test(file));
    const officialHooks = hooks.filter((file) => !LEGACY_RE.test(file)).sort();
    const legacyHooks = hooks.filter((file) => LEGACY_RE.test(file)).sort();

    const legacyFiles = domainFiles
      .map(relativeToRoot)
      .filter((file) => LEGACY_RE.test(file))
      .sort();

    const tables = new Set<string>();
    const rpcs = new Set<string>();
    const directDbOutsideServices = new Set<string>();
    const crossModuleImports = new Set<string>();

    for (const file of domainFiles) {
      const relativeFile = relativeToRoot(file);
      const content = fs.readFileSync(file, "utf-8");
      const scanContent = stripBlockComments(content)
        .split("\n")
        .map(stripInlineComment)
        .join("\n");

      extractMatches(content, TABLE_RE).forEach((table) => tables.add(table));
      extractTableConstants(content).forEach((table) => tables.add(table));
      extractMatches(content, RPC_RE).forEach((rpc) => rpcs.add(rpc));

      if (!hasAllowedDbMarker(relativeFile) && SUPABASE_BOUNDARY_RE.test(scanContent)) {
        directDbOutsideServices.add(relativeFile);
      }

      const moduleMatch = normalize(relativeFile).match(/^src\/modules\/([^/]+)\//);
      if (!moduleMatch) continue;

      const currentModule = moduleMatch[1];
      for (const specifier of extractImports(content)) {
        const importModuleMatch = specifier.match(/^@\/modules\/([^/]+)/);
        if (importModuleMatch && importModuleMatch[1] !== currentModule) {
          crossModuleImports.add(`${relativeFile} -> ${specifier}`);
          continue;
        }

        const resolved = resolveImport(file, specifier);
        if (!resolved) continue;
        const otherModuleMatch = resolved.match(/\/src\/modules\/([^/]+)\//);
        if (otherModuleMatch && otherModuleMatch[1] !== currentModule) {
          crossModuleImports.add(`${relativeFile} -> ${relativeToRoot(resolved)}`);
        }
      }
    }

    const duplicatedServices = Array.from(serviceGroups.entries())
      .filter(([, groupedFiles]) => groupedFiles.length > 1 && groupedFiles.some((file) => services.includes(file)))
      .map(([basename, groupedFiles]) => `${basename} -> ${groupedFiles.join(", ")}`)
      .sort();

    const duplicatedTypes = Array.from(typeGroups.entries())
      .filter(
        ([, groupedFiles]) =>
          groupedFiles.length > 1 &&
          groupedFiles.some((file) =>
            domain.sourceRoots.some((rootDir) => file.startsWith(normalize(rootDir))),
          ),
      )
      .map(([basename, groupedFiles]) => `${basename} -> ${groupedFiles.join(", ")}`)
      .sort();

    const docs = Array.from(
      new Set(
        [
          ...domain.docsPaths.filter((docPath) => fs.existsSync(path.join(ROOT, docPath))).map(normalize),
          ...domainFiles
            .map(relativeToRoot)
            .filter((file) => file.endsWith("README.md") || file.includes("/docs/")),
        ].sort(),
      ),
    );

    const domainRoutes = routes
      .filter((route) => route.domain === domain.id)
      .map((route) => `${route.path} -> ${route.component ?? "layout"}`)
      .sort();

    return {
      domain: domain.label,
      services,
      pages,
      routes: domainRoutes,
      tables: Array.from(tables).sort(),
      rpcs: Array.from(rpcs).sort(),
      officialHooks,
      legacyHooks,
      legacyFiles,
      docs,
      directDbOutsideServices: Array.from(directDbOutsideServices).sort(),
      crossModuleImports: Array.from(crossModuleImports).sort(),
      duplicatedServices,
      duplicatedTypes,
    };
  });
}

function markdownTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [head, separator, body].filter(Boolean).join("\n");
}

function renderInventoryMarkdown(inventories: DomainInventory[], routes: RouteEntry[]): string {
  const coreDirs = fs
    .readdirSync(path.join(SRC_DIR, "core"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const moduleDirs = fs
    .readdirSync(path.join(SRC_DIR, "modules"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const routeRows = routes
    .map((route) => [
      `\`${route.path}\``,
      route.component ? `\`${route.component}\`` : "layout",
      route.file ? `\`${route.file}\`` : "-",
      route.domain ? `\`${route.domain}\`` : "-",
    ])
    .sort((a, b) => a[0].localeCompare(b[0]));

  const inventoryRows = inventories.map((inventory) => {
    const domain = DOMAIN_REGISTRY.find((entry) => entry.label === inventory.domain)!;
    return [
      `\`${inventory.domain}\``,
      String(inventory.services.length),
      String(inventory.pages.length),
      String(inventory.routes.length),
      String(inventory.tables.length),
      String(inventory.officialHooks.length),
      String(inventory.legacyHooks.length),
      String(inventory.directDbOutsideServices.length),
      String(inventory.crossModuleImports.length),
      String(inventory.duplicatedServices.length),
      String(inventory.duplicatedTypes.length),
      `\`${domain.criticality}\``,
    ];
  });

  const details = inventories
    .map((inventory) => {
      const domain = DOMAIN_REGISTRY.find((entry) => entry.label === inventory.domain)!;
      return [
        `## ${inventory.domain}`,
        `- SSOT atual: ${domain.ssotSummary}`,
        `- Admin: ${domain.adminSummary}`,
        `- Documentacao: ${domain.docsSummary}`,
        `- Services: ${inventory.services.length ? inventory.services.map((item) => `\`${item}\``).join(", ") : "nenhum mapeado"}`,
        `- Pages: ${inventory.pages.length ? inventory.pages.map((item) => `\`${item}\``).join(", ") : "nenhuma pagina propria"}`,
        `- Routes: ${inventory.routes.length ? inventory.routes.map((item) => `\`${item}\``).join(", ") : "nenhuma rota propria mapeada"}`,
        `- Tabelas: ${inventory.tables.length ? inventory.tables.map((item) => `\`${item}\``).join(", ") : "nenhuma query detectada"}`,
        `- RPCs: ${inventory.rpcs.length ? inventory.rpcs.map((item) => `\`${item}\``).join(", ") : "nenhuma RPC detectada"}`,
        `- Hooks oficiais: ${inventory.officialHooks.length ? inventory.officialHooks.map((item) => `\`${item}\``).join(", ") : "nenhum hook oficial detectado"}`,
        `- Hooks legados: ${inventory.legacyHooks.length ? inventory.legacyHooks.map((item) => `\`${item}\``).join(", ") : "nenhum hook legado detectado"}`,
        `- Arquivos legados: ${inventory.legacyFiles.length ? inventory.legacyFiles.map((item) => `\`${item}\``).join(", ") : "nenhum arquivo legado detectado"}`,
        `- Acesso direto ao banco fora de service: ${inventory.directDbOutsideServices.length ? inventory.directDbOutsideServices.map((item) => `\`${item}\``).join(", ") : "nenhum detectado"}`,
        `- Imports cruzados entre modulos: ${inventory.crossModuleImports.length ? inventory.crossModuleImports.map((item) => `\`${item}\``).join(", ") : "nenhum detectado"}`,
        `- Duplicacoes de services: ${inventory.duplicatedServices.length ? inventory.duplicatedServices.map((item) => `\`${item}\``).join(", ") : "nenhuma duplicacao relevante detectada"}`,
        `- Duplicacoes de tipos: ${inventory.duplicatedTypes.length ? inventory.duplicatedTypes.map((item) => `\`${item}\``).join(", ") : "nenhuma duplicacao relevante detectada"}`,
        `- Docs ligadas ao dominio: ${inventory.docs.length ? inventory.docs.map((item) => `\`${item}\``).join(", ") : "sem docs ativas dedicadas"}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "# Inventario Estrutural do Projeto",
    "",
    `Gerado em ${new Date().toISOString()}.`,
    "",
    "## Modulos existentes",
    `- Core: ${coreDirs.map((item) => `\`${item}\``).join(", ")}`,
    `- Modules: ${moduleDirs.map((item) => `\`${item}\``).join(", ")}`,
    "",
    "## Componentes compartilhados criticos",
    ...CRITICAL_SHARED_COMPONENTS.map((component) => `- \`${component}\``),
    "",
    "## Observacoes documentais",
    ...DOC_OBSERVATIONS.map((note) => `- ${note}`),
    "",
    "## Matriz resumida por dominio",
    markdownTable(
      [
        "Dominio",
        "Services",
        "Pages",
        "Routes",
        "Tables",
        "Hooks oficiais",
        "Hooks legados",
        "DB fora service",
        "Imports cruzados",
        "Dup. service",
        "Dup. tipo",
        "Criticidade",
      ],
      inventoryRows,
    ),
    "",
    "## Paginas e rotas mapeadas",
    markdownTable(["Rota", "Componente", "Arquivo", "Dominio"], routeRows),
    "",
    details,
    "",
  ].join("\n");
}

function writeOutputs(inventories: DomainInventory[], routes: RouteEntry[]): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "PROJECT_INVENTORY.md"),
    renderInventoryMarkdown(inventories, routes),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "project-inventory.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        inventories,
        routes,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

function main(): void {
  const routes = parseRoutes()
    .map(normalizeRouteEntry)
    .map((route) => ({
      ...route,
      domain: inferDomainFromRoute(route),
    }));
  const inventories = collectDomainInventory();
  writeOutputs(inventories, routes);
  console.log("Architecture inventory generated at docs/audits/PROJECT_INVENTORY.md");
}

main();
