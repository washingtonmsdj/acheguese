#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

import {
  type MigrationFile,
  validateMigrationFiles,
} from "./validate-supabase-migrations-engine";

export { validateMigrationFiles };
export type { MigrationFile };

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const FILENAME_PATTERN = /^(\d+)_(.+)\.sql$/;
const FUTURE_MIGRATION_RATCHET_VERSION = "20260830101000";

function readMigrationFiles(): MigrationFile[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => {
      const match = entry.name.match(FILENAME_PATTERN);
      if (!match) {
        throw new Error(
          `Migration com nome invalido: ${entry.name}. Use <timestamp>_name.sql.`,
        );
      }

      return {
        name: entry.name,
        version: match[1],
        fullPath: path.join(MIGRATIONS_DIR, entry.name),
      };
    });
}

function extractMigrationVersion(violation: string): string | null {
  const match = violation.match(/\b(20\d{12})_[A-Za-z0-9_-]+\.sql\b/);
  return match?.[1] ?? null;
}

function isRetroactiveRatchetViolation(violation: string): boolean {
  const version = extractMigrationVersion(violation);
  if (!version || version >= FUTURE_MIGRATION_RATCHET_VERSION) return false;

  return (
    violation.startsWith("Funcao SECURITY DEFINER sem SET search_path explicito em ") ||
    violation.startsWith("RPC concedida a anon/PUBLIC sem classificacao Security Authority: ") ||
    violation.startsWith("Migration toca objeto PostGIS/extension-owner sem preflight vinculado: ")
  );
}

export function validateMigrationRatchet(files: MigrationFile[]): string[] {
  return validateMigrationFiles(files).filter(
    (violation) => !isRetroactiveRatchetViolation(violation),
  );
}

function main() {
  const violations = validateMigrationRatchet(readMigrationFiles());

  if (violations.length > 0) {
    console.error("Falhas de hygiene em migrations Supabase:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log(
    `Migrations Supabase estao consistentes; ratchets futuros aplicados a partir de ${FUTURE_MIGRATION_RATCHET_VERSION}.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
