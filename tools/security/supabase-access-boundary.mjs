import { extname } from 'path';

const SUPABASE_ACCESS_BOUNDARY_EXTENSIONS = new Set(['.ts', '.tsx']);
const UI_LAYER_SEGMENTS = new Set(['pages', 'components', 'hooks', 'contexts']);
const DIRECT_SUPABASE_ACCESS_PATTERN = /\bsupabase\s*\.\s*(?:from|rpc|storage|auth)\b/g;

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

function isUiLayerPath(relativePath) {
  return relativePath
    .split('/')
    .some((segment) => UI_LAYER_SEGMENTS.has(segment));
}

export function shouldScanSupabaseAccessBoundaryFile(relativePath) {
  const normalized = toPosix(relativePath);

  if (!normalized.startsWith('src/')) return false;
  if (normalized.startsWith('src/integrations/supabase/')) return false;
  if (isTestPath(normalized)) return false;
  if (!SUPABASE_ACCESS_BOUNDARY_EXTENSIONS.has(extname(normalized))) return false;

  return isUiLayerPath(normalized);
}

function collectDirectAccesses(content) {
  const matches = [];

  DIRECT_SUPABASE_ACCESS_PATTERN.lastIndex = 0;
  let match = DIRECT_SUPABASE_ACCESS_PATTERN.exec(content);
  while (match) {
    matches.push(match[0]);
    match = DIRECT_SUPABASE_ACCESS_PATTERN.exec(content);
  }

  return matches;
}

export function validateSupabaseAccessBoundaryFiles(files) {
  const issues = [];

  for (const file of files) {
    const relativePath = toPosix(file.path ?? file.relativePath ?? '');
    const content = file.content ?? '';

    if (!relativePath || typeof content !== 'string') continue;
    if (!shouldScanSupabaseAccessBoundaryFile(relativePath)) continue;

    const matches = collectDirectAccesses(content);
    if (matches.length === 0) continue;

    issues.push({
      severity: 'CRITICO',
      check: 'Acesso Supabase direto em camada de UI',
      file: relativePath,
      matches: matches.length,
      message:
        `${relativePath} chama Supabase diretamente (${Array.from(new Set(matches)).join(', ')}). ` +
        'Pages, components, hooks e contexts devem consumir services/repositories ou hooks de dominio, mantendo RLS/RPC e regras de autorizacao auditaveis fora da UI.',
    });
  }

  return issues;
}
