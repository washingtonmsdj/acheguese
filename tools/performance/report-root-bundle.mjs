import fs from "node:fs";
import path from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const MANIFEST_PATH = path.join(DIST, ".vite", "manifest.json");
const JSON_REPORT_PATH = path.join(DIST, "root-bundle-report.json");
const MARKDOWN_REPORT_PATH = path.join(DIST, "root-bundle-report.md");

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(
    "Missing dist/.vite/manifest.json. Run `npm run build:analyze` before this report.",
  );
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const normalize = (value) => value.replaceAll("\\", "/");

function findKeyBySrc(sourcePath) {
  const expected = normalize(sourcePath);
  return Object.entries(manifest).find(([, entry]) => {
    const src = typeof entry.src === "string" ? normalize(entry.src) : "";
    return src === expected || src.endsWith(`/${expected}`);
  })?.[0] ?? null;
}

function findKeysByFileFragment(fragment) {
  return Object.entries(manifest)
    .filter(([, entry]) =>
      typeof entry.file === "string" && entry.file.includes(fragment),
    )
    .map(([key]) => key);
}

function collectStaticManifestKeys(startKeys) {
  const visited = new Set();
  const visit = (key) => {
    if (!key || visited.has(key)) return;
    const entry = manifest[key];
    if (!entry) return;
    visited.add(key);
    for (const dependency of entry.imports ?? []) visit(dependency);
  };
  startKeys.forEach(visit);
  return visited;
}

function collectFiles(manifestKeys) {
  const files = new Set();
  for (const key of manifestKeys) {
    const entry = manifest[key];
    if (!entry) continue;
    if (entry.file) files.add(entry.file);
    for (const css of entry.css ?? []) files.add(css);
    for (const asset of entry.assets ?? []) files.add(asset);
  }
  return files;
}

function sizeFile(relativePath) {
  const absolutePath = path.join(DIST, relativePath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
    return null;
  }
  const bytes = fs.readFileSync(absolutePath);
  return {
    file: normalize(relativePath),
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes).byteLength,
  };
}

function summarizeFiles(files) {
  const measured = [...files]
    .map(sizeFile)
    .filter(Boolean)
    .sort((a, b) => b.raw - a.raw);

  return {
    raw: measured.reduce((total, item) => total + item.raw, 0),
    gzip: measured.reduce((total, item) => total + item.gzip, 0),
    brotli: measured.reduce((total, item) => total + item.brotli, 0),
    files: measured,
  };
}

function groupFromStartKeys(name, startKeys) {
  const keys = collectStaticManifestKeys(startKeys.filter(Boolean));
  return {
    name,
    manifestKeys: [...keys],
    files: collectFiles(keys),
  };
}

function isKeyOutsideClosure(key, closureKeys) {
  return key ? !closureKeys.has(key) : null;
}

const mainKey =
  findKeyBySrc("src/main.tsx") ??
  Object.entries(manifest).find(([, entry]) => entry.isEntry)?.[0] ??
  null;

if (!mainKey) {
  console.error("Unable to find the Vite main entry in the analyze manifest.");
  process.exit(1);
}

const mapRuntimeKey = findKeyBySrc(
  "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
);
const passiveRuntimeKey = findKeyBySrc(
  "src/core/maps/components/v3/MapLibrePassiveRuntime.tsx",
);
const fullMapRuntimeKey = findKeyBySrc(
  "src/core/maps/components/v3/MapLibreAdapterRuntime.tsx",
);
const boundaryKey = findKeyBySrc(
  "src/core/geospatial/data/officialFeatureServerBoundary.ts",
);
const routedAppRuntimeKey = findKeyBySrc(
  "src/app/components/RoutedAppRuntime.tsx",
);
const sentryKeys = findKeysByFileFragment("vendor-sentry");
const mapLibreVendorKeys = findKeysByFileFragment("vendor-maplibre");

const initial = groupFromStartKeys("initial-bootstrap", [mainKey]);
const mapShell = groupFromStartKeys("territory-map-runtime", [mapRuntimeKey]);
const passiveMap = groupFromStartKeys("passive-map-runtime", [passiveRuntimeKey]);
const mapEngine = groupFromStartKeys("maplibre-engine", mapLibreVendorKeys);
const boundary = groupFromStartKeys("official-boundary", [boundaryKey]);
const sentry = groupFromStartKeys("deferred-sentry", sentryKeys);

const initialManifestKeys = new Set(initial.manifestKeys);
const firstUsableMapManifestKeys = new Set([
  ...initial.manifestKeys,
  ...mapShell.manifestKeys,
  ...passiveMap.manifestKeys,
  ...mapEngine.manifestKeys,
]);
const firstUsableMapFiles = new Set([
  ...initial.files,
  ...mapShell.files,
  ...passiveMap.files,
  ...mapEngine.files,
]);

const invariants = {
  fullMapRuntimeDeferredFromFirstUsableMap: isKeyOutsideClosure(
    fullMapRuntimeKey,
    firstUsableMapManifestKeys,
  ),
  officialBoundaryDeferredFromFirstUsableMap: isKeyOutsideClosure(
    boundaryKey,
    firstUsableMapManifestKeys,
  ),
  routedAppRuntimeDeferredFromInitialBootstrap: isKeyOutsideClosure(
    routedAppRuntimeKey,
    initialManifestKeys,
  ),
  sentryDeferredFromInitialBootstrap:
    sentryKeys.length > 0
      ? sentryKeys.every((key) => !initialManifestKeys.has(key))
      : null,
};

const groups = {
  initialBootstrap: summarizeFiles(initial.files),
  firstUsableMap: summarizeFiles(firstUsableMapFiles),
  mapRuntime: summarizeFiles(new Set([...mapShell.files, ...passiveMap.files])),
  mapLibreEngine: summarizeFiles(mapEngine.files),
  officialBoundary: summarizeFiles(boundary.files),
  deferredSentry: summarizeFiles(sentry.files),
};

const report = {
  generatedAt: new Date().toISOString(),
  commitSha: process.env.GITHUB_SHA ?? null,
  entry: mainKey,
  sourcesFound: {
    mapRuntime: Boolean(mapRuntimeKey),
    passiveRuntime: Boolean(passiveRuntimeKey),
    fullMapRuntime: Boolean(fullMapRuntimeKey),
    officialBoundary: Boolean(boundaryKey),
    routedAppRuntime: Boolean(routedAppRuntimeKey),
    mapLibreVendorChunks: mapLibreVendorKeys.length,
    sentryVendorChunks: sentryKeys.length,
  },
  invariants,
  groups,
};

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function invariantLabel(value) {
  if (value === true) return "PASS";
  if (value === false) return "FAIL";
  return "NOT FOUND";
}

const tableRows = Object.entries(groups)
  .map(
    ([name, value]) =>
      `| ${name} | ${kib(value.raw)} | ${kib(value.gzip)} | ${kib(value.brotli)} | ${value.files.length} |`,
  )
  .join("\n");

const invariantRows = Object.entries(invariants)
  .map(([name, value]) => `| ${name} | ${invariantLabel(value)} |`)
  .join("\n");

const largestFirstMapFiles = groups.firstUsableMap.files
  .slice(0, 12)
  .map((file) => `- \`${file.file}\` — ${kib(file.raw)} raw / ${kib(file.brotli)} brotli`)
  .join("\n");

const markdown = `# Root bundle report\n\nSHA: \`${report.commitSha ?? "local"}\`\n\n| Group | Raw | Gzip | Brotli | Files |\n|---|---:|---:|---:|---:|\n${tableRows}\n\n## Separation invariants\n\n| Invariant | Result |\n|---|---|\n${invariantRows}\n\n## Largest files in first usable map closure\n\n${largestFirstMapFiles || "- none"}\n`;

fs.writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(MARKDOWN_REPORT_PATH, markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}\n`);
}

console.log(markdown);

const failedInvariants = Object.entries(invariants).filter(
  ([, value]) => value === false,
);
if (failedInvariants.length > 0) {
  console.error(
    `Public root bundle separation failed: ${failedInvariants
      .map(([name]) => name)
      .join(", ")}`,
  );
  process.exitCode = 1;
}
