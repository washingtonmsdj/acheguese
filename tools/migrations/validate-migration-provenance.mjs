import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fingerprintMigrationSql } from "./migration-statement-fingerprint.mjs";

const root = process.cwd();
const manifestPath = path.join(root, "supabase", "migration-provenance.json");
const allowedProvenance = new Set([
  "ORIGINAL_GIT_EXACT",
  "REMOTE_EXACT_STATEMENTS",
  "CANONICAL_REMOTE_RECONSTRUCTION",
  "TEXT_ARTIFACT_UNRECOVERED",
  "OPERATIONAL_HISTORY_UNRECOVERED",
]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(manifestPath)) {
  fail("manifesto supabase/migration-provenance.json ausente.");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const trackedFiles = new Set(
    execFileSync("git", ["ls-files", "--", "supabase/migrations/*.sql"], {
      cwd: root,
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => file.replace(/\\/g, "/")),
  );
  const seenVersions = new Set();
  const seenFiles = new Set();
  let readyForGit = 0;

  if (manifest.schemaVersion !== 1) fail("schemaVersion do manifesto deve ser 1.");
  if (manifest.remoteBaseline?.migrationCount !== 339) {
    fail("baseline remoto deve registrar exatamente 339 migrations.");
  }
  if (manifest.scope?.entryCount !== (manifest.entries ?? []).length) {
    fail("entryCount do manifesto diverge da quantidade de entradas materializadas.");
  }

  for (const entry of manifest.entries ?? []) {
    if (seenVersions.has(entry.version)) fail(`versao duplicada no manifesto: ${entry.version}.`);
    if (seenFiles.has(entry.file)) fail(`arquivo duplicado no manifesto: ${entry.file}.`);
    seenVersions.add(entry.version);
    seenFiles.add(entry.file);

    if (!allowedProvenance.has(entry.provenanceClass)) {
      fail(`classe de proveniencia invalida em ${entry.version}: ${entry.provenanceClass}.`);
    }
    if (entry.remotePresence !== true) {
      fail(`${entry.version}: presenca remota historica nao registrada.`);
    }

    const relativeFile = `supabase/migrations/${entry.file}`;
    const absoluteFile = path.join(root, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      fail(`migration historica ausente: ${relativeFile}.`);
      continue;
    }

    const actual = fingerprintMigrationSql(fs.readFileSync(absoluteFile, "utf8"));
    for (const kind of ["raw", "operational"]) {
      const expected = entry.localFingerprint?.[kind];
      if (!expected || JSON.stringify(actual[kind]) !== JSON.stringify(expected)) {
        fail(`fingerprint ${kind} divergente em ${entry.version}.`);
      }
    }

    const isTracked = trackedFiles.has(relativeFile);
    if (entry.trackingStatus === "TRACKED" && !isTracked) {
      fail(`${entry.version} deveria estar tracked no Git.`);
    } else if (entry.trackingStatus === "READY_FOR_GIT" && !isTracked) {
      readyForGit += 1;
    } else if (!new Set(["TRACKED", "READY_FOR_GIT"]).has(entry.trackingStatus)) {
      fail(`trackingStatus invalido em ${entry.version}.`);
    }

    if (
      entry.provenanceClass === "TEXT_ARTIFACT_UNRECOVERED" &&
      entry.operationalStatus !== "STATEMENT_EXACT"
    ) {
      fail(`${entry.version}: artefato textual so e aceito com STATEMENT_EXACT.`);
    }
    if (
      entry.provenanceClass === "TEXT_ARTIFACT_UNRECOVERED" &&
      JSON.stringify(entry.remoteOperationalFingerprint) !==
        JSON.stringify(actual.operational)
    ) {
      fail(`${entry.version}: equivalencia operacional remota nao esta comprovada.`);
    }
    if (entry.provenanceClass === "OPERATIONAL_HISTORY_UNRECOVERED") {
      fail(`${entry.version}: historico operacional irrecuperavel permanece no manifesto.`);
    }
  }

  const pendingFiles = manifest.localPendingNew ?? [];
  for (const file of pendingFiles) {
    if (!fs.existsSync(path.join(root, "supabase", "migrations", file))) {
      fail(`migration LOCAL_PENDING_NEW ausente: ${file}.`);
    }
  }

  if (!process.exitCode) {
    console.log(
      `PASS: proveniencia local validada (${seenVersions.size} historicas, ${readyForGit} READY_FOR_GIT, ${pendingFiles.length} LOCAL_PENDING_NEW).`,
    );
    console.log("REMOTE_VALIDATION_REQUIRED: este gate nao consulta o projeto Supabase remoto.");
  }
}
