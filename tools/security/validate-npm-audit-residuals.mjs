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

if (residualDoc.schemaVersion !== "dependency-audit-residuals/v1") {
  throw new Error("Unsupported dependency audit residual schema");
}

const residuals = Array.isArray(residualDoc.residuals) ? residualDoc.residuals : [];
const active = residuals.filter((entry) => entry && typeof entry === "object");
const vulnerabilities = audit.vulnerabilities ?? {};
const vulnerabilityNames = Object.keys(vulnerabilities);

if (vulnerabilityNames.length === 0) {
  console.log("Dependency audit full tree is clean.");
  process.exit(0);
}

if (active.length !== 1) {
  throw new Error("Full-tree dependency audit currently requires exactly one explicit residual");
}

const residual = active[0];
const today = new Date().toISOString().slice(0, 10);
if (typeof residual.validUntil !== "string" || today > residual.validUntil) {
  throw new Error(`Dependency audit residual expired on ${residual.validUntil ?? "unknown"}`);
}
if (residual.scope !== "development-only" || residual.productionAuditMustPass !== true) {
  throw new Error("Dependency audit residual must remain development-only with a clean production audit");
}
if (residual.package !== "braces" || residual.installedVersion !== "3.0.3") {
  throw new Error("Dependency audit residual package/version drifted");
}
if (residual.advisory !== "GHSA-vfj7-8cjw-p6xm" || residual.severity !== "high") {
  throw new Error("Dependency audit residual advisory/severity drifted");
}

const allowed = new Set(residual.allowedMetaPackages ?? []);
if (allowed.size === 0) {
  throw new Error("Dependency audit residual must list exact meta packages");
}

const unexpected = vulnerabilityNames.filter((name) => !allowed.has(name));
if (unexpected.length > 0) {
  throw new Error(`Unexpected high/critical dependency findings: ${unexpected.join(", ")}`);
}

for (const name of vulnerabilityNames) {
  const node = lock.packages?.[`node_modules/${name}`];
  if (!node || node.dev !== true) {
    throw new Error(`Residual package is not dev-only in lockfile: ${name}`);
  }
  const severity = String(vulnerabilities[name]?.severity ?? "");
  if (!["high", "critical"].includes(severity)) {
    throw new Error(`Unexpected residual severity for ${name}: ${severity}`);
  }
}

const bracesVia = Array.isArray(vulnerabilities.braces?.via)
  ? vulnerabilities.braces.via
  : [];
const advisoryMatched = bracesVia.some((entry) => {
  if (!entry || typeof entry !== "object") return false;
  return String(entry.url ?? "").includes(residual.advisory);
});
if (!advisoryMatched) {
  throw new Error("Expected braces advisory is not present in npm audit JSON");
}

console.log(
  `Accepted governed dev-only residual ${residual.id}: ${residual.advisory}; valid through ${residual.validUntil}.`,
);
