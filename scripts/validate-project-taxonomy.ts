#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MODULES_README_PATH = "src/modules/README.md";
const TAXONOMY_SSOT_PATH = "docs/architecture/TAXONOMY_SSOT.md";
const CANONICAL_MAP_PATH = "docs/CANONICAL_MAP.md";
const CORE_LAYER_SSOT_PATH = "docs/architecture/CORE_LAYER_SSOT.md";
const GLOBAL_STRUCTURAL_AUDIT_PATH = "docs/AUDITORIA_ESTRUTURAL_GLOBAL.md";
const STATUS_ATUAL_PATH = "docs/STATUS_ATUAL.md";
const LEGACY_SSOT_INDEX_PATH = "docs/INDICE_DOCUMENTACAO_SSOT.md";
const COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH =
  "docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md";
const COMMUNITY_FIRST_PLAN_PATH = "plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md";
const ARCHITECTURE_REGISTRY_PATH = "scripts/lib/architecture-registry.ts";
const VERTICAL_CONFIG_PATH = "src/core/verticals/config.ts";
const COMMUNITY_EXPERIENCE_REPOSITORY_PATH =
  "src/core/community-experience/repositories/CommunityExperienceRepository.ts";
const COMMUNITY_MEMBERSHIP_REPOSITORY_PATH =
  "src/core/community-experience/repositories/CommunityMembershipRepository.ts";
const COMMUNITY_ENTITY_LINK_REPOSITORY_PATH =
  "src/core/community-experience/repositories/CommunityEntityLinkRepository.ts";
const APP_LAZY_IMPORTS_PATH = "src/app/routes/lazyImports.ts";
const APP_LAYOUT_ROUTES_PATH = "src/app/routes/sections/AppLayoutRoutes.tsx";
const APP_LAYOUT_ROUTE_REGISTRY_PATH =
  "src/app/routes/sections/AppLayoutRouteRegistry.tsx";

const CANONICAL_MODULES = [
  "admin",
  "ai",
  "business",
  "central",
  "classifieds",
  "community-alerts",
  "community-events",
  "community-feed",
  "community-groups",
  "community-issues",
  "community-lost-found",
  "community-recommendations",
  "communication-territorial",
  "guide",
  "mobility",
  "professionals",
  "profile",
  "work-opportunities",
] as const;

const DEPRECATED_COMPAT_MODULE_ROOTS = [
  "community",
] as const;

const LEGACY_FORBIDDEN_MODULE_ROOTS = [
  "admin-identidade",
  "admin-motoristas",
  "analytics",
  "dashboard",
  "delivery",
  "empresa",
  "empresas-landing",
  "gastronomy",
  "jobs",
  "notifications",
  "onboarding",
  "promotions",
  "services",
  "vagas",
  "verification",
] as const;

const LEGACY_FORBIDDEN_CORE_ROOTS = [
  "admin-identidade",
  "admin-motoristas",
  "community-alerts",
  "civic",
  "events",
  "gastronomy",
  "lostfound",
  "profile",
  "supabase",
  "promotions",
  "services",
  "tourist-points",
  "vagas",
] as const;

const REQUIRED_NESTED_PATHS = [
  "src/modules/business/company",
  "src/modules/business/gastronomy",
  "src/modules/business/promotions",
  "src/modules/community-alerts",
  "src/modules/community-events",
  "src/modules/community-feed",
  "src/modules/community-groups",
  "src/modules/community-issues",
  "src/modules/community-lost-found",
  "src/modules/community-recommendations",
  "src/modules/mobility/delivery",
  "src/modules/classifieds/jobs",
  "src/modules/professionals/services",
  "src/app/features/landing",
  "src/app/features/business-landing",
  "src/app/features/onboarding",
] as const;

const FORBIDDEN_LEGACY_PATH_LITERALS = [
  "src/modules/admin-identidade",
  "src/modules/admin-motoristas",
  "src/modules/analytics",
  "src/modules/dashboard",
  "src/modules/delivery",
  "src/modules/empresa",
  "src/modules/empresas-landing",
  "src/modules/gastronomy",
  "src/modules/jobs",
  "src/modules/landing",
  "src/modules/notifications",
  "src/modules/onboarding",
  "src/modules/promotions",
  "src/modules/services",
  "src/modules/vagas",
  "src/modules/verification",
] as const;

const LEGACY_SCAN_IGNORE_FILES = new Set([
  "scripts/validate-project-taxonomy.ts",
  "scripts/fix-architecture-violations.ts",
  "scripts/fix-remaining-violations.ts",
]);

const COMMUNITY_FIRST_DOC_MARKERS = [
  "**Comunidade Local**",
  "`locations`",
  "`territorial_groups`",
  "`territory_communities`",
  "`community_public_aliases`",
  "`community_memberships`",
  "`community_entity_links`",
  "`src/core/community-experience`",
  "`plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`",
] as const;

const TAXONOMY_COMMUNITY_FIRST_MARKERS = [
  "`Comunidade Local`",
  "`territory_communities`",
  "`community_public_aliases`",
  "`community_memberships`",
  "`community_entity_links`",
  "`src/core/community-experience`",
] as const;

const COMMUNITY_EXPERIENCE_TABLE_ACCESS_RE =
  /\.from\(\s*["'](?:territory_communities|community_public_aliases|community_memberships|community_entity_links)["']/;
const COMMUNITY_EXPERIENCE_TABLE_SSOT_PATHS = new Set([
  COMMUNITY_EXPERIENCE_REPOSITORY_PATH,
  COMMUNITY_MEMBERSHIP_REPOSITORY_PATH,
  COMMUNITY_ENTITY_LINK_REPOSITORY_PATH,
]);
const CORE_TO_MODULE_IMPORT_RE =
  /(?:from\s+["']|export\s+(?:type\s+)?(?:\{[\s\S]*?\}|\*)\s+from\s+["'])@\/modules\//m;
const CORE_TO_MODULE_IMPORT_ALLOWLIST = new Set<string>();
const FAVORITES_SERVICES_BARREL_IMPORT_RE =
  /from\s+["']@\/core\/favorites\/services(?:\/index)?["']/;
const APP_LAYOUT_ROUTE_REGISTRY_MARKERS = [
  "APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES",
  "renderAppLayoutRouteDescriptors",
] as const;
const APP_LAYOUT_EXTRACTED_ROUTE_COMPONENTS = [
  "<P.TerritorialCategoryBusinessPage />",
  "<P.TerritorialServicesPage />",
  "<P.TerritorialClassificadosPage />",
  "<P.TerritorialEventosPage />",
  "<P.TerritorialMapPage />",
] as const;
const COMMUNITY_MODULE_EMPTY_FACADE_PATHS = [
  "src/core/community-events/index.ts",
  "src/modules/community-events/index.ts",
  "src/modules/community-feed/index.ts",
  "src/modules/community-feed/pages/ComunidadePage.tsx",
  "src/modules/community-feed/pages/NovoPostPage.tsx",
  "src/modules/community-feed/components/composer/CreatePostModal.tsx",
  "src/modules/community-feed/components/composer/UnifiedComposer.tsx",
  "src/modules/community-feed/hooks/composer/useCreatePostForm.ts",
  "src/modules/community-groups/index.ts",
  "src/modules/community-groups/pages/GruposPage.tsx",
  "src/modules/community-groups/pages/GrupoDetailPage.tsx",
  "src/modules/community-recommendations/index.ts",
  "src/modules/community-recommendations/pages/RecomendacoesPage.tsx",
  "src/modules/community-recommendations/pages/NovaRecomendacaoPage.tsx",
  "src/modules/community-recommendations/pages/RecomendacaoDetailPage.tsx",
  "src/modules/community-lost-found/index.ts",
  "src/modules/community-lost-found/pages/AchadosPerdidosPage.tsx",
  "src/modules/community-lost-found/pages/NovoAchadoPerdidoPage.tsx",
  "src/modules/community-lost-found/pages/AchadoPerdidoDetailPage.tsx",
] as const;
const COMMUNITY_MODULE_EMPTY_FACADE_IMPORTS = [
  "@/modules/community-feed/pages/ComunidadePage",
  "@/modules/community-feed/pages/NovoPostPage",
  "@/modules/community-feed/components/composer/CreatePostModal",
  "@/modules/community-feed/components/composer/UnifiedComposer",
  "@/modules/community-feed/hooks/composer/useCreatePostForm",
  "@/modules/community-groups/pages/GruposPage",
  "@/modules/community-groups/pages/GrupoDetailPage",
  "@/modules/community-recommendations/pages/RecomendacoesPage",
  "@/modules/community-recommendations/pages/NovaRecomendacaoPage",
  "@/modules/community-recommendations/pages/RecomendacaoDetailPage",
  "@/modules/community-lost-found/pages/AchadosPerdidosPage",
  "@/modules/community-lost-found/pages/NovoAchadoPerdidoPage",
  "@/modules/community-lost-found/pages/AchadoPerdidoDetailPage",
] as const;
const ACTIVE_COMMUNITY_DOCS_WITHOUT_LEGACY_AGGREGATOR = [
  CANONICAL_MAP_PATH,
  CORE_LAYER_SSOT_PATH,
  GLOBAL_STRUCTURAL_AUDIT_PATH,
] as const;
const ACTIVE_COMMUNITY_DOC_FORBIDDEN_MARKERS = [
  "src/modules/community/README.md",
  "src/modules/community/issues",
  "src/modules/community/events",
  "src/modules/community/lostfound",
  "migrar para `src/modules/community`",
  "-> `src/modules/community`",
] as const;
const GLOBAL_STRUCTURAL_AUDIT_REQUIRED_MARKERS = [
  "`ai`",
  "`central`",
  "`communication-territorial`",
  "`community-feed`",
  "`community-alerts`",
  "`community-issues`",
  "`community-groups`",
  "`community-events`",
  "`community-lost-found`",
  "`community-recommendations`",
  "`work-opportunities`",
  "Estado oficial atual: `gastronomy` e `education`.",
  "`src/core/community-experience`",
] as const;
const GLOBAL_STRUCTURAL_AUDIT_FORBIDDEN_MARKERS = [
  "  - `community`",
  "community/{alerts",
  "apenas `gastronomy` e vertical formal",
  "agregador canonico `src/modules/community`",
] as const;
const STATUS_ATUAL_COMMUNITY_FIRST_MARKERS = [
  "Atualizacao 2026-07-09 (Community First / SSOT operacional)",
  "`plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`",
  "`docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`",
  "`src/core/community-experience`",
  "`community_entity_links`",
  "`community_memberships`",
  "`src/modules/community-feed`",
  "`src/modules/community` nao e modulo canonico vigente",
  "Caminhos historicos",
] as const;
const LEGACY_SSOT_INDEX_REQUIRED_MARKERS = [
  "Historico: este arquivo era um indice antigo",
  "[INDEX_CANONICO.md](./INDEX_CANONICO.md)",
  "[STATUS_ATUAL.md](./STATUS_ATUAL.md)",
  "[architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)",
] as const;
const LEGACY_SSOT_INDEX_FORBIDDEN_MARKERS = [
  "Sistema 100% implementado",
  "RESUMO_FINAL_SSOT_COMPLETO.md",
  "VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md` (principal)",
] as const;
const COMMUNITY_FIRST_PLAN_STATUS_REQUIRED_MARKERS = [
  "Status: concluida em 2026-07-09 para contrato backend/RLS, services e consumo",
  "Status: concluida em 2026-07-09 para contrato federado de busca/Home.",
  "Indice denormalizado/RPC de busca fica adiado para fase futura condicionada por",
  "Status: concluida em 2026-07-09 para SSOT, launch gates e testes.",
] as const;
const COMMUNITY_FIRST_PLAN_STATUS_FORBIDDEN_MARKERS = [
  "- [ ] criar indice denormalizado/RPC de busca quando escala e ranking exigirem",
] as const;

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readText(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, "utf8");
}

function extractVerticalKeysFromConfig(): string[] {
  const content = readText(VERTICAL_CONFIG_PATH);
  if (!content) {
    return [];
  }

  const match = content.match(/export\s+const\s+VERTICAL_KEYS[^=]*=\s*\[([^\]]*)\]/m);
  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/["']([^"']+)["']/g)).map((item) => item[1]);
}

function listDirectories(relativeDir: string): string[] {
  const full = path.join(ROOT, relativeDir);
  if (!fs.existsSync(full)) {
    return [];
  }
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function toSet(values: readonly string[]): Set<string> {
  return new Set(values);
}

function walkFiles(relativeDir: string): string[] {
  const fullDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(fullDir)) {
    return [];
  }

  const collected: string[] = [];
  const stack = [fullDir];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      collected.push(fullPath);
    }
  }

  return collected;
}

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isTestFile(relativePath: string): boolean {
  return (
    relativePath.includes("/__tests__/") ||
    relativePath.endsWith(".spec.ts") ||
    relativePath.endsWith(".spec.tsx") ||
    relativePath.endsWith(".test.ts") ||
    relativePath.endsWith(".test.tsx")
  );
}

function main() {
  const violations: string[] = [];

  const moduleRoots = listDirectories("src/modules");
  const moduleRootSet = toSet(moduleRoots);
  const canonicalModuleSet = toSet(CANONICAL_MODULES);
  const deprecatedCompatModuleSet = toSet(DEPRECATED_COMPAT_MODULE_ROOTS);

  for (const root of moduleRoots) {
    if (!canonicalModuleSet.has(root) && !deprecatedCompatModuleSet.has(root)) {
      violations.push(
        `Modulo de topo fora do SSOT em src/modules: "${root}". Permitidos: ${CANONICAL_MODULES.join(", ")}`,
      );
    }
  }

  for (const required of CANONICAL_MODULES) {
    if (!moduleRootSet.has(required)) {
      violations.push(`Modulo canonico ausente em src/modules: "${required}"`);
    }
  }

  for (const legacyRoot of LEGACY_FORBIDDEN_MODULE_ROOTS) {
    if (moduleRootSet.has(legacyRoot)) {
      violations.push(
        `Alias/pasta legada proibida ainda presente em src/modules: "${legacyRoot}"`,
      );
    }
  }

  const coreRoots = listDirectories("src/core");
  const coreRootSet = toSet(coreRoots);
  for (const legacyCoreRoot of LEGACY_FORBIDDEN_CORE_ROOTS) {
    if (coreRootSet.has(legacyCoreRoot)) {
      violations.push(
        `Pasta legada proibida ainda presente em src/core: "${legacyCoreRoot}"`,
      );
    }
  }

  for (const requiredPath of REQUIRED_NESTED_PATHS) {
    if (!pathExists(requiredPath)) {
      violations.push(`Path obrigatorio ausente para taxonomia oficial: ${requiredPath}`);
    }
  }

  const emptyModuleIndexes = walkFiles("src/modules")
    .map((filePath) => normalize(path.relative(ROOT, filePath)))
    .filter((relative) => relative.endsWith("/index.ts"))
    .filter((relative) => readText(relative)?.trim() === "export {};");

  for (const emptyIndex of emptyModuleIndexes) {
    violations.push(
      `Facade vazia de modulo proibida: ${emptyIndex}. Remova o arquivo ou exponha um contrato publico real; caminhos de pagina/subdominio devem ser importados explicitamente.`,
    );
  }

  const modulesReadme = readText(MODULES_README_PATH);
  if (!modulesReadme) {
    violations.push(`Documento de taxonomia de modulos ausente: ${MODULES_README_PATH}`);
  } else {
    for (const moduleName of CANONICAL_MODULES) {
      if (!modulesReadme.includes(`- \`${moduleName}\``)) {
        violations.push(
          `Modulo canonico ausente em ${MODULES_README_PATH}: "${moduleName}"`,
        );
      }
    }

    if (modulesReadme.includes("- `community`\n")) {
      violations.push(
        `${MODULES_README_PATH} nao pode listar "community" como modulo canonico; use community-* explicitos.`,
      );
    }

    if (!modulesReadme.includes("`src/core/community-experience`")) {
      violations.push(
        `${MODULES_README_PATH} deve declarar src/core/community-experience como owner da Comunidade Local.`,
      );
    }
  }

  const communityFirstDoc = readText(COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH);
  if (!communityFirstDoc) {
    violations.push(
      `Contrato Community First ausente: ${COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH}`,
    );
  } else {
    for (const marker of COMMUNITY_FIRST_DOC_MARKERS) {
      if (!communityFirstDoc.includes(marker)) {
        violations.push(
          `Contrato Community First sem marcador obrigatorio "${marker}" em ${COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH}`,
        );
      }
    }
  }

  if (!pathExists(COMMUNITY_FIRST_PLAN_PATH)) {
    violations.push(`Plano Community First ausente: ${COMMUNITY_FIRST_PLAN_PATH}`);
  } else {
    const communityFirstPlan = readText(COMMUNITY_FIRST_PLAN_PATH);
    if (communityFirstPlan) {
      for (const marker of COMMUNITY_FIRST_PLAN_STATUS_REQUIRED_MARKERS) {
        if (!communityFirstPlan.includes(marker)) {
          violations.push(
            `${COMMUNITY_FIRST_PLAN_PATH} deve refletir o fechamento das fases Community First ja implementadas; falta marcador "${marker}".`,
          );
        }
      }

      for (const marker of COMMUNITY_FIRST_PLAN_STATUS_FORBIDDEN_MARKERS) {
        if (communityFirstPlan.includes(marker)) {
          violations.push(
            `${COMMUNITY_FIRST_PLAN_PATH} ainda contem pendencia fora de escopo como tarefa aberta: "${marker}".`,
          );
        }
      }
    }
  }

  const appLayoutRoutes = readText(APP_LAYOUT_ROUTES_PATH);
  if (!appLayoutRoutes) {
    violations.push(`Shell de rotas da aplicacao ausente: ${APP_LAYOUT_ROUTES_PATH}`);
  } else {
    for (const marker of APP_LAYOUT_ROUTE_REGISTRY_MARKERS) {
      if (!appLayoutRoutes.includes(marker)) {
        violations.push(
          `${APP_LAYOUT_ROUTES_PATH} deve consumir ${marker} em vez de re-declarar rotas territoriais extraidas.`,
        );
      }
    }

    for (const component of APP_LAYOUT_EXTRACTED_ROUTE_COMPONENTS) {
      if (appLayoutRoutes.includes(component)) {
        violations.push(
          `${APP_LAYOUT_ROUTES_PATH} nao deve declarar ${component} diretamente; use ${APP_LAYOUT_ROUTE_REGISTRY_PATH}.`,
        );
      }
    }
  }

  const appLayoutRouteRegistry = readText(APP_LAYOUT_ROUTE_REGISTRY_PATH);
  if (!appLayoutRouteRegistry) {
    violations.push(`Registry declarativo de rotas ausente: ${APP_LAYOUT_ROUTE_REGISTRY_PATH}`);
  } else {
    for (const component of APP_LAYOUT_EXTRACTED_ROUTE_COMPONENTS) {
      if (!appLayoutRouteRegistry.includes(component)) {
        violations.push(
          `${APP_LAYOUT_ROUTE_REGISTRY_PATH} deve manter ${component} como rota territorial declarativa extraida.`,
        );
      }
    }
  }

  const lazyImports = readText(APP_LAZY_IMPORTS_PATH);
  if (!lazyImports) {
    violations.push(`Registry de lazy imports ausente: ${APP_LAZY_IMPORTS_PATH}`);
  } else {
    for (const forbiddenImport of COMMUNITY_MODULE_EMPTY_FACADE_IMPORTS) {
      if (lazyImports.includes(forbiddenImport)) {
        violations.push(
          `${APP_LAZY_IMPORTS_PATH} nao deve carregar recurso comunitario por facade vazia de src/modules (${forbiddenImport}). Use o owner canonico em src/core/community-*`,
        );
      }
    }
  }

  for (const compatPath of COMMUNITY_MODULE_EMPTY_FACADE_PATHS) {
    if (pathExists(compatPath)) {
      violations.push(
        `Facade vazia comunitaria proibida: ${compatPath}. Rotas e testes devem apontar para owners canonicos explicitos, e modules deve manter apenas boundary de produto quando houver implementacao real.`,
      );
    }
  }

  const taxonomySsot = readText(TAXONOMY_SSOT_PATH);
  if (!taxonomySsot) {
    violations.push(`Documento TAXONOMY SSOT ausente: ${TAXONOMY_SSOT_PATH}`);
  } else {
    for (const marker of TAXONOMY_COMMUNITY_FIRST_MARKERS) {
      if (!taxonomySsot.includes(marker)) {
        violations.push(
          `TAXONOMY SSOT sem marcador Community First "${marker}" em ${TAXONOMY_SSOT_PATH}`,
        );
      }
    }
  }

  for (const activeDocPath of ACTIVE_COMMUNITY_DOCS_WITHOUT_LEGACY_AGGREGATOR) {
    const content = readText(activeDocPath);
    if (!content) {
      violations.push(`Documento ativo ausente: ${activeDocPath}`);
      continue;
    }

    for (const marker of ACTIVE_COMMUNITY_DOC_FORBIDDEN_MARKERS) {
      if (content.includes(marker)) {
        violations.push(
          `${activeDocPath} nao deve apontar "${marker}" como destino atual; use Community First com src/core/community-* e src/modules/community-* explicitos.`,
        );
      }
    }
  }

  const globalAudit = readText(GLOBAL_STRUCTURAL_AUDIT_PATH);
  if (globalAudit) {
    for (const marker of GLOBAL_STRUCTURAL_AUDIT_REQUIRED_MARKERS) {
      if (!globalAudit.includes(marker)) {
        violations.push(
          `${GLOBAL_STRUCTURAL_AUDIT_PATH} esta fora da taxonomia atual; falta marcador "${marker}".`,
        );
      }
    }

    for (const marker of GLOBAL_STRUCTURAL_AUDIT_FORBIDDEN_MARKERS) {
      if (globalAudit.includes(marker)) {
        violations.push(
          `${GLOBAL_STRUCTURAL_AUDIT_PATH} ainda contem marcador legado "${marker}".`,
        );
      }
    }
  }

  const statusAtual = readText(STATUS_ATUAL_PATH);
  if (!statusAtual) {
    violations.push(`Status operacional ausente: ${STATUS_ATUAL_PATH}`);
  } else {
    for (const marker of STATUS_ATUAL_COMMUNITY_FIRST_MARKERS) {
      if (!statusAtual.includes(marker)) {
        violations.push(
          `${STATUS_ATUAL_PATH} deve declarar o estado Community First vigente antes do historico; falta marcador "${marker}".`,
        );
      }
    }
  }

  const legacySsotIndex = readText(LEGACY_SSOT_INDEX_PATH);
  if (!legacySsotIndex) {
    violations.push(`Indice historico SSOT ausente: ${LEGACY_SSOT_INDEX_PATH}`);
  } else {
    for (const marker of LEGACY_SSOT_INDEX_REQUIRED_MARKERS) {
      if (!legacySsotIndex.includes(marker)) {
        violations.push(
          `${LEGACY_SSOT_INDEX_PATH} deve apontar para os SSOTs vigentes; falta marcador "${marker}".`,
        );
      }
    }

    for (const marker of LEGACY_SSOT_INDEX_FORBIDDEN_MARKERS) {
      if (legacySsotIndex.includes(marker)) {
        violations.push(
          `${LEGACY_SSOT_INDEX_PATH} ainda contem marcador legado "${marker}".`,
        );
      }
    }
  }

  const architectureRegistry = readText(ARCHITECTURE_REGISTRY_PATH);
  if (!architectureRegistry) {
    violations.push(`Architecture registry ausente: ${ARCHITECTURE_REGISTRY_PATH}`);
  } else {
    if (!architectureRegistry.includes('id: "community-experience"')) {
      violations.push(
        `${ARCHITECTURE_REGISTRY_PATH} deve registrar community-experience como dominio arquitetural.`,
      );
    }
    if (!architectureRegistry.includes(COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH)) {
      violations.push(
        `${ARCHITECTURE_REGISTRY_PATH} deve apontar para ${COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH}.`,
      );
    }
  }

  const verticalKeys = extractVerticalKeysFromConfig();
  if (verticalKeys.length === 0) {
    violations.push(`Nao foi possivel ler VERTICAL_KEYS em ${VERTICAL_CONFIG_PATH}`);
  }

  const verticalDocs = [
    [MODULES_README_PATH, modulesReadme],
    [TAXONOMY_SSOT_PATH, taxonomySsot],
    [COMMUNITY_FIRST_ARCHITECTURE_DOC_PATH, communityFirstDoc],
  ] as const;

  for (const verticalKey of verticalKeys) {
    for (const [docPath, content] of verticalDocs) {
      if (content && !content.includes(`\`${verticalKey}\``)) {
        violations.push(
          `${docPath} esta fora de sincronia com ${VERTICAL_CONFIG_PATH}: falta vertical "${verticalKey}".`,
        );
      }
    }
  }

  const scannedSourceFiles = [...walkFiles("src"), ...walkFiles("scripts")].filter((filePath) => {
    const normalized = normalize(filePath);
    return (
      normalized.endsWith(".ts") ||
      normalized.endsWith(".tsx") ||
      normalized.endsWith(".js") ||
      normalized.endsWith(".jsx")
    );
  });

  for (const filePath of scannedSourceFiles) {
    const relative = normalize(path.relative(ROOT, filePath));
    if (LEGACY_SCAN_IGNORE_FILES.has(relative)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    if (
      relative.startsWith("src/core/") &&
      !isTestFile(relative) &&
      !CORE_TO_MODULE_IMPORT_ALLOWLIST.has(relative) &&
      CORE_TO_MODULE_IMPORT_RE.test(content)
    ) {
      violations.push(
        `Dependencia invertida detectada em ${relative}: src/core nao deve importar ou reexportar src/modules. Mova o owner para core real ou importe o modulo diretamente no consumidor.`,
      );
    }

    if (
      relative.startsWith("src/") &&
      !isTestFile(relative) &&
      !COMMUNITY_EXPERIENCE_TABLE_SSOT_PATHS.has(relative) &&
      COMMUNITY_EXPERIENCE_TABLE_ACCESS_RE.test(content)
    ) {
      violations.push(
        `Acesso direto a tabela de Comunidade Local fora do SSOT em ${relative}. Use repositorios canonicos em src/core/community-experience/repositories/.`,
      );
    }

    if (
      relative.startsWith("src/") &&
      !isTestFile(relative) &&
      FAVORITES_SERVICES_BARREL_IMPORT_RE.test(content)
    ) {
      violations.push(
        `Import runtime do barrel de favoritos detectado em ${relative}. Use src/core/favorites/services/favorites.queries ou favorites.mutations para evitar ciclo de chunks.`,
      );
    }

    for (const legacyPath of FORBIDDEN_LEGACY_PATH_LITERALS) {
      if (content.includes(legacyPath)) {
        violations.push(
          `Referencia legada detectada em ${relative}: "${legacyPath}"`,
        );
      }
    }
  }

  if (violations.length > 0) {
    console.error("Taxonomia estrutural invalida:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Taxonomia estrutural valida.");
}

main();
