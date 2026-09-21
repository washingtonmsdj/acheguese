#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const WORKFLOWS_DIR = join(ROOT, ".github", "workflows");
const PACKAGE_JSON_PATH = join(ROOT, "package.json");

const WORKFLOW_FILE_RE = /\.ya?ml$/i;
const LOCAL_FILE_RE =
  /(?:^|[\s"'\`(&=])((?:\.?[\\/])?(?:(?:tools|scripts|src|tests|supabase|api|public)[\\/][A-Za-z0-9_.@()\\/-]+?\.(?:ps1|mjs|cjs|js|ts|tsx|sh|sql|json|toml)))(?=$|[\s"'\`),;])/gm;
const NPM_RUN_RE =
  /\bnpm(?:\.cmd)?\s+run\s+(?:(?:--silent|-s)\s+)?([A-Za-z0-9:_-]+)/g;
const POWERSHELL_NPM_ARRAY_RE =
  /@\(\s*["']run["']\s*,\s*["']([A-Za-z0-9:_-]+)["']/g;
const LOCAL_ACTION_RE = /\buses:\s*["']?(\.\/[A-Za-z0-9_.@/-]+)["']?/g;

function normalizeLocalReference(value) {
  return value
    .trim()
    .replace(/^\.?[\\/]/, "")
    .replaceAll("\\", "/");
}

function workflowFiles() {
  if (!existsSync(WORKFLOWS_DIR)) {
    throw new Error(".github/workflows is missing");
  }

  return readdirSync(WORKFLOWS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && WORKFLOW_FILE_RE.test(entry.name))
    .map((entry) => join(WORKFLOWS_DIR, entry.name))
    .sort();
}

function collectMatches(text, regex, group = 1) {
  regex.lastIndex = 0;
  return [...text.matchAll(regex)].map((match) => match[group]);
}

function collectWorkflowContract(filePath, packageScripts) {
  const source = readFileSync(filePath, "utf8");
  const workflow = relative(ROOT, filePath).replaceAll("\\", "/");
  const violations = [];

  const localFiles = new Set(
    collectMatches(source, LOCAL_FILE_RE).map(normalizeLocalReference),
  );
  const localActions = new Set(
    collectMatches(source, LOCAL_ACTION_RE).map(normalizeLocalReference),
  );
  const npmScripts = new Set([
    ...collectMatches(source, NPM_RUN_RE),
    ...collectMatches(source, POWERSHELL_NPM_ARRAY_RE),
  ]);

  for (const localFile of localFiles) {
    if (localFile.startsWith("scripts/")) {
      violations.push(
        `${workflow}: retired root scripts/** reference is forbidden: ${localFile}`,
      );
      continue;
    }

    const absolutePath = resolve(ROOT, localFile);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      violations.push(
        `${workflow}: local file reference does not exist: ${localFile}`,
      );
    }
  }

  for (const localAction of localActions) {
    const absolutePath = resolve(ROOT, localAction);
    if (!existsSync(absolutePath)) {
      violations.push(
        `${workflow}: local action reference does not exist: ${localAction}`,
      );
    }
  }

  for (const script of npmScripts) {
    if (!Object.hasOwn(packageScripts, script)) {
      violations.push(
        `${workflow}: npm script reference does not exist in package.json: ${script}`,
      );
    }
  }

  return {
    workflow,
    localFiles: localFiles.size,
    localActions: localActions.size,
    npmScripts: npmScripts.size,
    violations,
  };
}

function main() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const packageScripts = pkg.scripts ?? {};
  const reports = workflowFiles().map((filePath) =>
    collectWorkflowContract(filePath, packageScripts),
  );
  const violations = reports.flatMap((report) => report.violations);

  if (violations.length > 0) {
    console.error("Workflow local-reference validation failed:");
    for (const violation of violations.sort()) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  const totals = reports.reduce(
    (acc, report) => ({
      localFiles: acc.localFiles + report.localFiles,
      localActions: acc.localActions + report.localActions,
      npmScripts: acc.npmScripts + report.npmScripts,
    }),
    { localFiles: 0, localActions: 0, npmScripts: 0 },
  );

  console.log(
    `Workflow local references valid: ${reports.length} workflows, ` +
      `${totals.localFiles} file refs, ${totals.localActions} local actions, ` +
      `${totals.npmScripts} npm script refs.`,
  );
}

main();
