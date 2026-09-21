#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectLgpdPurgeReadiness,
  loadLgpdPurgePolicy,
} from "./lgpd-purge-policy-lib.mjs";

function runCli() {
  const json = process.argv.includes("--json");
  const policy = loadLgpdPurgePolicy();
  const status = inspectLgpdPurgeReadiness(policy);

  if (json) {
    console.log(JSON.stringify(status, null, 2));
  } else if (status.ready) {
    console.log("LGPD_PURGE_POLICY_READY");
  } else {
    console.error("LGPD_PURGE_POLICY_BLOCKED");
    console.error(`Blockers: ${status.blockerIds.join(", ")}`);
    console.error(`NO ACTION auth FKs: ${status.noActionForeignKeyBlockers}`);
    console.error(`User identifiers without auth FK: ${status.nonForeignKeyUserIdentifiers}`);
    console.error(`Profile FKs: ${status.profileForeignKeys}`);
    console.error(`Profile CASCADE FKs: ${status.profileCascadeForeignKeys}`);
    console.error(`Profile hard blockers: ${status.profileHardBlockers}`);
  }

  if (!status.ready) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(
      `LGPD_PURGE_POLICY_ERROR: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    process.exitCode = 1;
  }
}
