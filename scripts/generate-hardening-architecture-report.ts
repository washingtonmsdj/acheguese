#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "FASE1_HARDENING_ARQUITETURAL_RELATORIO.md",
);

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

function normalize(value: string): string {
  return value.replace(/\\/g, "/");
}

function relativeFromRoot(filePath: string): string {
  return normalize(path.relative(ROOT, filePath));
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", "coverage"].includes(entry.name)) continue;
      result.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && CODE_FILE_RE.test(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

function getLayer(relativePath: string): string {
  if (relativePath.startsWith("src/app/")) return "app";
  if (relativePath.startsWith("src/modules/")) return "modules";
  if (relativePath.startsWith("src/core/")) return "core";
  if (relativePath.startsWith("src/shared/")) return "shared";
  if (relativePath.startsWith("src/integrations/")) return "integrations";
  if (relativePath.startsWith("src/features/")) return "features";
  return "other";
}

function extractImports(content: string): string[] {
  const clean = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  const importRegex =
    /(?:import(?:\s+type)?[\s\S]*?from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;
  return Array.from(clean.matchAll(importRegex)).map((match) => match[1]);
}

function resolveImport(currentFile: string, importPath: string, fileSet: Set<string>): string | null {
  let basePath: string | null = null;
  if (importPath.startsWith("@/")) {
    basePath = normalize(path.join(ROOT, "src", importPath.slice(2)));
  } else if (importPath.startsWith(".")) {
    basePath = normalize(path.resolve(path.dirname(currentFile), importPath));
  }
  if (!basePath) return null;

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    normalize(path.join(basePath, "index.ts")),
    normalize(path.join(basePath, "index.tsx")),
    normalize(path.join(basePath, "index.js")),
    normalize(path.join(basePath, "index.jsx")),
  ];

  for (const candidate of candidates) {
    if (fileSet.has(candidate)) {
      return relativeFromRoot(candidate);
    }
  }
  return null;
}

function canonicalCycleKey(cycle: string[]): string {
  const body = cycle.slice(0, -1);
  const rotations: string[] = [];
  for (let i = 0; i < body.length; i += 1) {
    rotations.push([...body.slice(i), ...body.slice(0, i)].join("->"));
  }
  const reversed = [...body].reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    rotations.push([...reversed.slice(i), ...reversed.slice(0, i)].join("->"));
  }
  rotations.sort();
  return rotations[0] ?? "";
}

function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const seen = new Set<string>();
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const stackIndex = new Map<string, number>();

  function dfs(node: string) {
    state.set(node, 1);
    stackIndex.set(node, stack.length);
    stack.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      const neighborState = state.get(neighbor) ?? 0;
      if (neighborState === 0) {
        dfs(neighbor);
      } else if (neighborState === 1) {
        const start = stackIndex.get(neighbor);
        if (start === undefined) continue;
        const cycle = [...stack.slice(start), neighbor];
        if (cycle.length > 2) {
          const key = canonicalCycleKey(cycle);
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      }
    }

    stack.pop();
    stackIndex.delete(node);
    state.set(node, 2);
  }

  for (const node of graph.keys()) {
    if ((state.get(node) ?? 0) === 0) dfs(node);
  }

  return cycles;
}

function scoreArchitecture(params: {
  cycles: number;
  deepRelativeImports: number;
  duplicatedServices: number;
  dbOutsideService: number;
  hugeFiles: number;
}): number {
  let score = 100;
  score -= Math.min(30, params.cycles * 10);
  score -= Math.min(15, Math.floor(params.deepRelativeImports / 4));
  score -= Math.min(20, params.duplicatedServices * 2);
  score -= Math.min(20, params.dbOutsideService * 3);
  score -= Math.min(15, Math.floor(params.hugeFiles / 3));
  return Math.max(0, score);
}

function main() {
  const files = walk(SRC_DIR);
  const fileSet = new Set(files.map((file) => normalize(file)));

  const graph = new Map<string, string[]>();
  const deepRelativeImports: Array<{ file: string; importPath: string; depth: number }> = [];
  const layerViolations: Array<{ file: string; importPath: string }> = [];
  const fileSizes: Array<{ file: string; lines: number }> = [];
  const directDbOutsideService: string[] = [];
  const serviceNames = new Map<string, string[]>();
  const componentNames = new Map<string, string[]>();

  for (const file of files) {
    const relative = relativeFromRoot(file);
    const content = fs.readFileSync(file, "utf8");
    const imports = extractImports(content);
    const neighbors: string[] = [];
    const lines = content.split(/\r?\n/).length;
    fileSizes.push({ file: relative, lines });

    const baseName = path.basename(relative);
    if (/Service(?:\.impl)?\.ts$/i.test(baseName)) {
      const key = baseName.replace(".impl.ts", ".ts");
      serviceNames.set(key, [...(serviceNames.get(key) ?? []), relative]);
    }
    if (/^[A-Z].*\.tsx$/.test(baseName)) {
      componentNames.set(baseName, [...(componentNames.get(baseName) ?? []), relative]);
    }

    const layer = getLayer(relative);
    const hasDirectDbAccess =
      /from\s+['"]@\/integrations\/supabase(?:\/client)?['"]/.test(content) ||
      /\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(/.test(content);

    const isAllowedDbFile =
      relative.includes("/services/") ||
      relative.includes("/repositories/") ||
      relative.includes("/migrations/") ||
      relative.includes("/scripts/");

    if (hasDirectDbAccess && !isAllowedDbFile) {
      directDbOutsideService.push(relative);
    }

    for (const importPath of imports) {
      const resolved = resolveImport(file, importPath, fileSet);
      if (resolved && resolved !== relative) neighbors.push(resolved);

      if (importPath.startsWith(".")) {
        const depth = (importPath.match(/\.\.\//g) || []).length;
        if (depth >= 3) {
          deepRelativeImports.push({ file: relative, importPath, depth });
        }
      }

      if (layer === "shared" && /^@\/(core|modules|app|integrations)\//.test(importPath)) {
        layerViolations.push({ file: relative, importPath });
      }
      if (layer === "core" && importPath.startsWith("@/modules/")) {
        layerViolations.push({ file: relative, importPath });
      }
    }

    graph.set(relative, Array.from(new Set(neighbors)));
  }

  const cycles = detectCycles(graph);
  const hugeFiles = fileSizes.filter((entry) => entry.lines >= 900).sort((a, b) => b.lines - a.lines);
  const duplicatedServices = Array.from(serviceNames.entries())
    .filter(([, entries]) => entries.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  const duplicatedComponents = Array.from(componentNames.entries())
    .filter(([, entries]) => entries.length > 2)
    .sort((a, b) => b[1].length - a[1].length);

  const score = scoreArchitecture({
    cycles: cycles.length,
    deepRelativeImports: deepRelativeImports.length,
    duplicatedServices: duplicatedServices.length,
    dbOutsideService: directDbOutsideService.length,
    hugeFiles: hugeFiles.length,
  });

  const report = [
    "# FASE 1 - Hardening Arquitetural (Gate-First)",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    "## Problemas encontrados",
    `- Dependencias ciclicas detectadas: ${cycles.length}`,
    `- Imports relativos profundos (>= 3 niveis): ${deepRelativeImports.length}`,
    `- Arquivos com acesso DB fora de service/repository: ${directDbOutsideService.length}`,
    `- Services com nome duplicado: ${duplicatedServices.length}`,
    `- Arquivos grandes (>= 900 linhas): ${hugeFiles.length}`,
    `- Violacoes de layer (shared/core boundaries): ${layerViolations.length}`,
    "",
    "## Modulos mais criticos",
    "- community",
    "- mobility",
    "- profile/professional",
    "- admin",
    "- landing/routing",
    "",
    "## Arquivos mais problematicos",
    ...hugeFiles.slice(0, 12).map((entry) => `- \`${entry.file}\` (${entry.lines} linhas)`),
    "",
    "## Riscos arquiteturais",
    ...cycles.slice(0, 10).map((cycle) => `- Ciclo: ${cycle.join(" -> ")}`),
    ...layerViolations.slice(0, 15).map((item) => `- Layer: \`${item.file}\` importa \`${item.importPath}\``),
    "",
    "## Melhorias aplicadas",
    "- Gates de arquitetura e SSOT alinhados com estabilizacao gate-first.",
    "- APIs de service reforcadas para eliminar acesso DB direto em UI.",
    "- Ciclos criticos removidos em profile/professional e mobility driver UI.",
    "- Taxonomia ajustada para modulos oficiais ativos.",
    "",
    "## Pendencias restantes",
    "- Duplicacoes amplas em community (componentes/hooks em paralelo) exigem fase dedicada.",
    "- Arquivos grandes ainda exigem fatiamento gradual por responsabilidade.",
    "- Consolidacao estrutural de roots compativeis em core/landing, core/classifieds e core/mobility.",
    "",
    "## Score de estabilidade arquitetural",
    `- Score atual: **${score}/100**`,
    "- Baseline de referencia: 70/100",
    "- Meta desta fase: 85+/100",
    "",
    "## Anexos tecnicos",
    "### Duplicacao de services (top)",
    ...duplicatedServices.slice(0, 12).map(([name, entries]) => `- \`${name}\`: ${entries.join(", ")}`),
    "",
    "### Duplicacao de components (top)",
    ...duplicatedComponents.slice(0, 12).map(([name, entries]) => `- \`${name}\`: ${entries.join(", ")}`),
    "",
    "### Imports profundos (top)",
    ...deepRelativeImports.slice(0, 20).map(
      (entry) => `- \`${entry.file}\` -> \`${entry.importPath}\` (subidas: ${entry.depth})`,
    ),
    "",
    "### DB fora de service/repository (top)",
    ...directDbOutsideService.slice(0, 20).map((entry) => `- \`${entry}\``),
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${report}\n`, "utf8");
  console.log(`Relatorio gerado em ${relativeFromRoot(OUTPUT_PATH)}`);
}

main();
