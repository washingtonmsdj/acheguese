import { extname } from 'path';

const EDGE_FUNCTION_BROKER_BOUNDARY_EXTENSIONS = new Set(['.ts', '.tsx']);
const CANONICAL_EDGE_FUNCTION_BROKER_PATH =
  'src/core/infrastructure/edge-functions/edgeFunctionBroker.ts';
const EDGE_FUNCTION_BROKER_ENVELOPE_PATTERN =
  /body\s*:\s*\{\s*(?:action\s*,\s*params|params\s*,\s*action)\b/g;

function toPosix(path) {
  return path.replace(/\\/g, '/');
}

function isTestPath(relativePath) {
  return (
    relativePath.includes('/__tests__/') ||
    relativePath.includes('/__mocks__/') ||
    /\.[a-z]*spec\.(?:ts|tsx)$/.test(relativePath) ||
    /\.[a-z]*test\.(?:ts|tsx)$/.test(relativePath)
  );
}

export function shouldScanEdgeFunctionBrokerBoundaryFile(relativePath) {
  const normalized = toPosix(relativePath);

  if (!normalized.startsWith('src/')) return false;
  if (normalized === CANONICAL_EDGE_FUNCTION_BROKER_PATH) return false;
  if (isTestPath(normalized)) return false;
  if (!EDGE_FUNCTION_BROKER_BOUNDARY_EXTENSIONS.has(extname(normalized))) return false;

  return true;
}

function collectBrokerEnvelopeMatches(content) {
  const matches = [];

  EDGE_FUNCTION_BROKER_ENVELOPE_PATTERN.lastIndex = 0;
  let match = EDGE_FUNCTION_BROKER_ENVELOPE_PATTERN.exec(content);
  while (match) {
    matches.push(match[0]);
    match = EDGE_FUNCTION_BROKER_ENVELOPE_PATTERN.exec(content);
  }

  return matches;
}

export function validateEdgeFunctionBrokerBoundaryFiles(files) {
  const issues = [];

  for (const file of files) {
    const relativePath = toPosix(file.path ?? file.relativePath ?? '');
    const content = file.content ?? '';

    if (!relativePath || typeof content !== 'string') continue;
    if (!shouldScanEdgeFunctionBrokerBoundaryFile(relativePath)) continue;

    const matches = collectBrokerEnvelopeMatches(content);
    if (matches.length === 0) continue;

    issues.push({
      severity: 'CRITICO',
      check: 'Broker Edge Function fora do helper canonico',
      file: relativePath,
      matches: matches.length,
      message:
        `${relativePath} monta envelope broker ${Array.from(new Set(matches)).join(', ')} fora do helper canonico. ` +
        'Chamadas Edge Function no formato { action, params } devem usar src/core/infrastructure/edge-functions/edgeFunctionBroker.ts para manter transporte, log e erro em um unico SSOT.',
    });
  }

  return issues;
}
