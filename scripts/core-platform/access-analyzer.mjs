import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

export const DEFAULT_SOURCE_ROOTS = ["src", "api", "supabase/functions"];

const CODE_FILE_RE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const MUTATION_METHODS = new Set([
  "delete",
  "insert",
  "move",
  "remove",
  "update",
  "upload",
  "upsert",
]);
const TEST_FILE_RE = /(?:^|\/)(?:__fixtures__|__mocks__|__tests__|e2e|tests?)(?:\/|$)|\.(?:spec|test)\.[cm]?[jt]sx?$/;
const GENERATED_FILE_RE = /(?:^|\/)(?:generated|types\.generated)\.[cm]?[jt]s$/;
const ACCESS_CANDIDATE_RE = /(?:\.from\s*(?:<|\()|\.rpc\s*\(|\.channel\s*\(|core\/interaction|feedService)/;

function normalize(filePath) {
  return filePath.replace(/\\/g, "/");
}

function relativeTo(root, filePath) {
  return normalize(path.relative(root, filePath));
}

function shouldScanFile(relativePath) {
  return (
    CODE_FILE_RE.test(relativePath) &&
    !TEST_FILE_RE.test(relativePath) &&
    !GENERATED_FILE_RE.test(relativePath)
  );
}

function walk(directory, root, output) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORY_NAMES.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, root, output);
      continue;
    }

    const relativePath = relativeTo(root, absolutePath);
    if (entry.isFile() && shouldScanFile(relativePath)) {
      output.push(absolutePath);
    }
  }
}

function getMethodName(callExpression) {
  const expression = callExpression.expression;
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression &&
    ts.isStringLiteralLike(expression.argumentExpression)
  ) {
    return expression.argumentExpression.text;
  }
  return null;
}

function getReceiver(callExpression) {
  const expression = callExpression.expression;
  if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
    return expression.expression;
  }
  return null;
}

function getStaticString(node, bindings = new Map()) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isParenthesizedExpression(node)
  ) {
    return getStaticString(node.expression, bindings);
  }
  if (ts.isIdentifier(node)) return bindings.get(node.text) ?? null;
  if (ts.isPropertyAccessExpression(node)) {
    return bindings.get(node.getText().replace(/\s+/g, "")) ?? null;
  }
  return null;
}

function collectStaticBindings(sourceFile) {
  const bindings = new Map();

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const directValue = getStaticString(node.initializer, bindings);
      if (directValue !== null) bindings.set(node.name.text, directValue);

      const initializer = ts.isAsExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const propertyName = property.name.getText(sourceFile).replace(/["']/g, "");
          const propertyValue = getStaticString(property.initializer, bindings);
          if (propertyValue !== null) {
            bindings.set(`${node.name.text}.${propertyName}`, propertyValue);
          }
        }
      }
    }

    if (
      ts.isPropertyDeclaration(node) &&
      node.initializer &&
      (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name))
    ) {
      const propertyValue = getStaticString(node.initializer, bindings);
      if (propertyValue !== null) {
        bindings.set(`this.${node.name.text}`, propertyValue);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return bindings;
}

function collectFollowingChainMethods(callExpression) {
  const methods = [];
  let cursor = callExpression;

  while (cursor.parent) {
    const parent = cursor.parent;
    if (
      (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
      parent.expression === cursor
    ) {
      const propertyName = ts.isPropertyAccessExpression(parent)
        ? parent.name.text
        : getStaticString(parent.argumentExpression);
      if (propertyName) methods.push(propertyName);
      cursor = parent;
      continue;
    }
    if (ts.isCallExpression(parent) && parent.expression === cursor) {
      cursor = parent;
      continue;
    }
    break;
  }

  return methods;
}

function getLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function isStorageReceiver(receiver, sourceFile) {
  if (!receiver) return false;
  const text = receiver.getText(sourceFile).replace(/\s+/g, "");
  return text === "storage" || text.endsWith(".storage") || text.includes(".storage.");
}

function isNonDatabaseFromReceiver(receiver, sourceFile) {
  if (!receiver) return false;
  const text = receiver.getText(sourceFile).replace(/\s+/g, "");
  return /(?:^|\.)(?:Array|Buffer|Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|BigInt64Array|BigUint64Array)$/.test(
    text,
  );
}

function accessRecord(kind, resource, file, line, access, detail) {
  return {
    kind,
    resource,
    file,
    line,
    access,
    ...(detail ? { detail } : {}),
  };
}

function scriptKindFor(filePath) {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs") || filePath.endsWith(".cjs")) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function isLegacyInteractionSpecifier(specifier) {
  return (
    specifier === "@/core/interaction" ||
    specifier.startsWith("@/core/interaction/") ||
    /(?:^|\/)core\/interaction(?:\/|$)/.test(specifier)
  );
}

export function analyzeSourceText(sourceText, file = "inline.ts") {
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(file),
  );
  const staticBindings = collectStaticBindings(sourceFile);
  const records = [];

  function recordModuleSpecifier(node, specifierNode) {
    const specifier = getStaticString(specifierNode, staticBindings);
    if (specifier && isLegacyInteractionSpecifier(specifier)) {
      records.push(
        accessRecord(
          "legacy-interaction-import",
          specifier,
          file,
          getLine(sourceFile, node),
          "import",
        ),
      );
    }
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) recordModuleSpecifier(node, node.moduleSpecifier);
    }

    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const sourceName = element.propertyName?.text ?? element.name.text;
        if (sourceName === "postService" && element.name.text === "feedService") {
          records.push(
            accessRecord(
              "feed-service-alias",
              "postService-as-feedService",
              file,
              getLine(sourceFile, element),
              "export",
            ),
          );
        }
      }
    }

    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        recordModuleSpecifier(node, node.arguments[0]);
      }

      const methodName = getMethodName(node);
      const firstArgument = node.arguments[0];
      const staticResource = getStaticString(firstArgument, staticBindings);
      const line = getLine(sourceFile, node);

      if (methodName === "from") {
        const receiver = getReceiver(node);
        if (isNonDatabaseFromReceiver(receiver, sourceFile)) {
          ts.forEachChild(node, visit);
          return;
        }
        const chainMethods = collectFollowingChainMethods(node);
        const access = chainMethods.some((method) => MUTATION_METHODS.has(method))
          ? "write"
          : "read";
        const detail = staticResource ? undefined : firstArgument?.getText(sourceFile) ?? "missing";

        if (isStorageReceiver(receiver, sourceFile)) {
          records.push(
            accessRecord(
              staticResource ? "storage" : "dynamic-storage",
              staticResource ?? "<dynamic>",
              file,
              line,
              access,
              detail,
            ),
          );
        } else {
          records.push(
            accessRecord(
              staticResource ? "table" : "dynamic-table",
              staticResource ?? "<dynamic>",
              file,
              line,
              access,
              detail,
            ),
          );
        }
      } else if (methodName === "rpc") {
        records.push(
          accessRecord(
            staticResource ? "rpc" : "dynamic-rpc",
            staticResource ?? "<dynamic>",
            file,
            line,
            "execute",
            staticResource ? undefined : firstArgument?.getText(sourceFile) ?? "missing",
          ),
        );
      } else if (methodName === "channel") {
        records.push(
          accessRecord(
            staticResource ? "channel" : "dynamic-channel",
            staticResource ?? "<dynamic>",
            file,
            line,
            "connect",
            staticResource ? undefined : firstArgument?.getText(sourceFile) ?? "missing",
          ),
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return records.sort(compareRecords);
}

function compareRecords(left, right) {
  return (
    left.kind.localeCompare(right.kind) ||
    left.resource.localeCompare(right.resource) ||
    left.file.localeCompare(right.file) ||
    left.line - right.line
  );
}

export function collectProjectAccess(root = process.cwd(), sourceRoots = DEFAULT_SOURCE_ROOTS) {
  const files = [];
  for (const sourceRoot of sourceRoots) {
    walk(path.join(root, sourceRoot), root, files);
  }

  return files
    .sort((left, right) => left.localeCompare(right))
    .flatMap((absolutePath) => {
      const relativePath = relativeTo(root, absolutePath);
      const sourceText = fs.readFileSync(absolutePath, "utf8");
      if (!ACCESS_CANDIDATE_RE.test(sourceText)) return [];
      return analyzeSourceText(sourceText, relativePath);
    })
    .sort(compareRecords);
}

export function groupAccessCounts(records) {
  const grouped = new Map();
  for (const record of records) {
    const key = `${record.kind}|${record.resource}|${record.access}|${record.file}`;
    const current = grouped.get(key) ?? {
      kind: record.kind,
      resource: record.resource,
      access: record.access,
      file: record.file,
      count: 0,
      lines: [],
      details: [],
    };
    current.count += 1;
    current.lines.push(record.line);
    if (record.detail && !current.details.includes(record.detail)) {
      current.details.push(record.detail);
    }
    grouped.set(key, current);
  }

  return [...grouped.values()].sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) ||
      left.resource.localeCompare(right.resource) ||
      left.access.localeCompare(right.access) ||
      left.file.localeCompare(right.file),
  );
}
