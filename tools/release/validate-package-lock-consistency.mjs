#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const MANIFEST_PATH = resolve(ROOT, "package.json");
const LOCK_PATH = resolve(ROOT, "package-lock.json");
const errors = [];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL: não foi possível ler ${label}: ${message}`);
    process.exit(1);
  }
}

function entriesFor(value) {
  return value && typeof value === "object" ? value : {};
}

const manifest = readJson(MANIFEST_PATH, "package.json");
const lock = readJson(LOCK_PATH, "package-lock.json");
const lockRoot = lock.packages?.[""];

if (lock.lockfileVersion !== 3) {
  errors.push(
    `package-lock.json deve usar lockfileVersion 3; encontrado ${String(lock.lockfileVersion)}`,
  );
}

if (!lockRoot || typeof lockRoot !== "object") {
  errors.push('package-lock.json não contém packages[""] para o pacote raiz');
}

if (lockRoot) {
  if (manifest.name !== lockRoot.name) {
    errors.push(
      `name diverge: package.json=${JSON.stringify(manifest.name)} package-lock.json=${JSON.stringify(lockRoot.name)}`,
    );
  }
  if (manifest.version !== lockRoot.version) {
    errors.push(
      `version diverge: package.json=${JSON.stringify(manifest.version)} package-lock.json=${JSON.stringify(lockRoot.version)}`,
    );
  }
}

const sections = ["dependencies", "devDependencies", "optionalDependencies"];
let compared = 0;

for (const section of sections) {
  const manifestEntries = entriesFor(manifest[section]);
  const lockEntries = entriesFor(lockRoot?.[section]);
  const names = [...new Set([...Object.keys(manifestEntries), ...Object.keys(lockEntries)])].sort();

  for (const name of names) {
    const inManifest = Object.hasOwn(manifestEntries, name);
    const inLock = Object.hasOwn(lockEntries, name);

    if (!inManifest) {
      errors.push(`${section}.${name} existe apenas no package-lock.json raiz`);
      continue;
    }
    if (!inLock) {
      errors.push(`${section}.${name} existe apenas no package.json`);
      continue;
    }

    compared += 1;
    if (manifestEntries[name] !== lockEntries[name]) {
      errors.push(
        `${section}.${name} diverge: package.json=${JSON.stringify(manifestEntries[name])} package-lock.json=${JSON.stringify(lockEntries[name])}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("FAIL: package.json e package-lock.json estão divergentes:");
  for (const error of errors) console.error(`  - ${error}`);
  console.error("Regere o lockfile com o npm canônico; não edite specs apenas em um dos arquivos.");
  process.exit(1);
}

console.log(
  `PASS: package.json e package-lock.json estão alinhados (${compared} dependências diretas verificadas).`,
);
