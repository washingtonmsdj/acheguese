import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [auditPath = "npm-audit-full.json"] = process.argv.slice(2);
const root = process.cwd();
const residualPath = resolve(
  root,
  "docs/09-reference/governance/security/DEPENDENCY_AUDIT_RESIDUALS.json",
);
const lockPath = resolve(root, "package-lock.json");

const residualDoc = JSON.parse(readFileSync(residualPath, "utf8"));
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const audit = JSON.parse(readFileSync(resolve(root, auditPath), "utf8"));

if (residualDoc.schemaVersion !== "dependency-audit-residuals/v2") {
  throw new Error("Unsupported dependency audit residual schema");
}

const residuals = Array.isArray(residualDoc.residuals) ? residualDoc.residuals : [];
const expectedSeverities = residualDoc.expectedVulnerabilitySeverities;
if (!expectedSeverities || typeof expectedSeverities !== "object" || Array.isArray(expectedSeverities)) {
  throw new Error("Dependency audit residuals must declare exact expected vulnerability severities");
}

const vulnerabilities = audit.vulnerabilities ?? {};
const vulnerabilityNames = Object.keys(vulnerabilities).sort();
const expectedNames = Object.keys(expectedSeverities).sort();

const sameStringSet = (left, right) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const packageLockNodes = (packageName) => {
  const suffix = `node_modules/${packageName}`;
  return Object.entries(lock.packages ?? {}).filter(
    ([key]) => key === suffix || key.endsWith(`/${suffix}`),
  );
};

if (vulnerabilityNames.length === 0) {
  if (residuals.length > 0 || expectedNames.length > 0) {
    throw new Error("Dependency audit is clean; governed residuals are stale and must be removed");
  }
  console.log("Dependency audit full tree is clean.");
  process.exit(0);
}

if (residuals.length === 0) {
  throw new Error("Full-tree dependency findings exist without an explicit governed residual");
}

if (!sameStringSet(vulnerabilityNames, expectedNames)) {
  const unexpected = vulnerabilityNames.filter((name) => !expectedNames.includes(name));
  const missing = expectedNames.filter((name) => !vulnerabilityNames.includes(name));
  throw new Error(
    `Dependency audit finding set drifted; unexpected=[${unexpected.join(", ")}], missing=[${missing.join(", ")}]`,
  );
}

for (const name of vulnerabilityNames) {
  const expectedSeverity = String(expectedSeverities[name] ?? "");
  const actualSeverity = String(vulnerabilities[name]?.severity ?? "");
  if (actualSeverity !== expectedSeverity) {
    throw new Error(
      `Dependency audit severity drifted for ${name}: expected ${expectedSeverity}, got ${actualSeverity}`,
    );
  }

  const nodes = packageLockNodes(name);
  if (nodes.length === 0) {
    throw new Error(`Residual package is absent from package-lock.json: ${name}`);
  }
  const productionReachable = nodes.find(([, node]) => node?.dev !== true);
  if (productionReachable) {
    throw new Error(`Residual package is not dev-only in lockfile: ${name} (${productionReachable[0]})`);
  }

  const fixAvailable = vulnerabilities[name]?.fixAvailable;
  if (fixAvailable === true) {
    throw new Error(`Compatible audit fix is now available for ${name}; residual must not hide it`);
  }
  if (
    fixAvailable &&
    typeof fixAvailable === "object" &&
    fixAvailable.isSemVerMajor !== true
  ) {
    throw new Error(`Non-breaking audit fix is now available for ${name}; residual must be removed or narrowed`);
  }
}

const today = new Date().toISOString().slice(0, 10);
const seenIds = new Set();
const seenAdvisories = new Set();
const coveredPackages = new Set();

for (const residual of residuals) {
  if (!residual || typeof residual !== "object") {
    throw new Error("Invalid dependency audit residual entry");
  }

  if (typeof residual.id !== "string" || residual.id.length === 0 || seenIds.has(residual.id)) {
    throw new Error(`Dependency audit residual id is missing or duplicated: ${residual.id ?? "unknown"}`);
  }
  seenIds.add(residual.id);

  if (typeof residual.validUntil !== "string" || today > residual.validUntil) {
    throw new Error(`Dependency audit residual expired on ${residual.validUntil ?? "unknown"}`);
  }
  if (residual.scope !== "development-only" || residual.productionAuditMustPass !== true) {
    throw new Error(
      `Dependency audit residual ${residual.id} must remain development-only with a clean production audit`,
    );
  }
  if (residual.breakingFixRequired !== true) {
    throw new Error(`Dependency audit residual ${residual.id} must require a breaking fix`);
  }

  const packageName = String(residual.package ?? "");
  const rootFinding = vulnerabilities[packageName];
  if (!packageName || !rootFinding) {
    throw new Error(`Residual root package is missing from current audit: ${packageName || "unknown"}`);
  }

  const advisory = String(residual.advisory ?? "");
  if (!advisory || seenAdvisories.has(advisory)) {
    throw new Error(`Dependency audit advisory is missing or duplicated: ${advisory || "unknown"}`);
  }
  seenAdvisories.add(advisory);

  if (String(rootFinding.severity ?? "") !== String(residual.severity ?? "")) {
    throw new Error(
      `Residual root severity drifted for ${packageName}: expected ${residual.severity}, got ${rootFinding.severity}`,
    );
  }

  const rootVia = Array.isArray(rootFinding.via) ? rootFinding.via : [];
  const advisoryMatched = rootVia.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return String(entry.url ?? "").includes(advisory);
  });
  if (!advisoryMatched) {
    throw new Error(`Expected advisory ${advisory} is not present on residual root ${packageName}`);
  }

  const installedVersions = Array.isArray(residual.installedVersions)
    ? [...new Set(residual.installedVersions.map(String))].sort()
    : [];
  if (installedVersions.length === 0) {
    throw new Error(`Residual ${residual.id} must declare exact installedVersions`);
  }
  const actualVersions = [
    ...new Set(packageLockNodes(packageName).map(([, node]) => String(node?.version ?? ""))),
  ].sort();
  if (!sameStringSet(installedVersions, actualVersions)) {
    throw new Error(
      `Residual installed version set drifted for ${packageName}: expected [${installedVersions.join(", ")}], got [${actualVersions.join(", ")}]`,
    );
  }

  const rootFix = rootFinding.fixAvailable;
  if (!rootFix || typeof rootFix !== "object" || rootFix.isSemVerMajor !== true) {
    throw new Error(`Residual root ${packageName} no longer requires a breaking audit fix`);
  }

  const affectedPackages = Array.isArray(residual.affectedPackages)
    ? [...new Set(residual.affectedPackages.map(String))]
    : [];
  if (affectedPackages.length === 0 || !affectedPackages.includes(packageName)) {
    throw new Error(`Residual ${residual.id} must list its root package in affectedPackages`);
  }
  for (const name of affectedPackages) {
    if (!vulnerabilities[name]) {
      throw new Error(`Residual ${residual.id} pre-authorizes a package absent from the current audit: ${name}`);
    }
    coveredPackages.add(name);
  }
}

const coveredNames = [...coveredPackages].sort();
if (!sameStringSet(coveredNames, vulnerabilityNames)) {
  const uncovered = vulnerabilityNames.filter((name) => !coveredPackages.has(name));
  const extra = coveredNames.filter((name) => !vulnerabilities[name]);
  throw new Error(
    `Governed residual coverage drifted; uncovered=[${uncovered.join(", ")}], extra=[${extra.join(", ")}]`,
  );
}

for (const residual of residuals) {
  console.log(
    `Accepted governed dev-only residual ${residual.id}: ${residual.advisory}; valid through ${residual.validUntil}.`,
  );
}
console.log(`Governed residual set exactly matches ${vulnerabilityNames.length} current dev-only audit findings.`);
