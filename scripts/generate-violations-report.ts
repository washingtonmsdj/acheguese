import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

interface DependencyNode {
  path: string;
  layer: string;
  module?: string;
  imports: string[];
}

interface Violation {
  file: string;
  layer: string;
  importPath: string;
  importLayer: string;
  type: 'invalid-layer' | 'cross-module';
  message: string;
}

const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  'app': ['app', 'modules', 'core', 'shared'],
  'modules': ['modules', 'core', 'shared'],
  'core': ['core', 'integrations', 'shared'],
  'shared': ['shared'],
  'integrations': []
};

function getLayer(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('app/') || normalized.includes('/app/')) return 'app';
  if (normalized.startsWith('modules/') || normalized.includes('/modules/')) return 'modules';
  if (normalized.startsWith('core/') || normalized.includes('/core/')) return 'core';
  if (normalized.startsWith('shared/') || normalized.includes('/shared/')) return 'shared';
  if (normalized.startsWith('integrations/') || normalized.includes('/integrations/')) return 'integrations';
  return null;
}

function getModule(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/modules\/([^/]+)/);
  return match ? match[1] : null;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const contentWithoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
  
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(contentWithoutComments)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('@/')) {
      imports.push(importPath);
    }
  }
  
  return imports;
}

function getAllTypeScriptFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') {
          continue;
        }
        files.push(...getAllTypeScriptFiles(fullPath, baseDir));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

function buildDependencyGraph(srcDir: string): Map<string, DependencyNode> {
  const graph = new Map<string, DependencyNode>();
  const files = getAllTypeScriptFiles(srcDir);
  
  for (const file of files) {
    const fullPath = join(srcDir, file);
    const layer = getLayer(file);
    
    if (!layer) continue;
    
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const imports = extractImports(content);
      
      graph.set(file, {
        path: file,
        layer,
        module: getModule(file),
        imports
      });
    } catch (error) {
      console.error(`Error reading ${fullPath}:`, error);
    }
  }
  
  return graph;
}

function analyzeViolations(graph: Map<string, DependencyNode>): Violation[] {
  const violations: Violation[] = [];
  
  for (const [file, node] of graph.entries()) {
    for (const importPath of node.imports) {
      const importLayer = importPath.split('/')[1];
      
      // Skip legacy imports
      if (['components', 'services', 'hooks', 'types', 'lib', 'contexts', 'stores', 'validation'].includes(importLayer)) {
        continue;
      }
      
      // Check for cross-module imports
      if (node.layer === 'modules' && importLayer === 'modules') {
        const sourceModule = node.module;
        const targetModuleMatch = importPath.match(/@\/modules\/([^/]+)/);
        const targetModule = targetModuleMatch ? targetModuleMatch[1] : null;
        
        if (sourceModule && targetModule && sourceModule !== targetModule) {
          violations.push({
            file,
            layer: node.layer,
            importPath,
            importLayer,
            type: 'cross-module',
            message: `Module "${sourceModule}" cannot import from module "${targetModule}"`
          });
        }
        continue;
      }
      
      // Check if this is an allowed dependency
      const allowedLayers = ALLOWED_DEPENDENCIES[node.layer] || [];
      
      if (!allowedLayers.includes(importLayer)) {
        violations.push({
          file,
          layer: node.layer,
          importPath,
          importLayer,
          type: 'invalid-layer',
          message: `Layer "${node.layer}" cannot import from "${importLayer}". Allowed: ${allowedLayers.join(', ')}`
        });
      }
    }
  }
  
  return violations;
}

// Main execution
const srcDir = join(process.cwd(), 'src');
console.log('Building dependency graph...');
const graph = buildDependencyGraph(srcDir);
console.log(`Analyzed ${graph.size} files`);

const violations = analyzeViolations(graph);
console.log(`Found ${violations.length} violations`);

// Group violations by type
const byType = violations.reduce((acc, v) => {
  if (!acc[v.type]) acc[v.type] = [];
  acc[v.type].push(v);
  return acc;
}, {} as Record<string, Violation[]>);

// Group violations by layer
const byLayer = violations.reduce((acc, v) => {
  if (!acc[v.layer]) acc[v.layer] = [];
  acc[v.layer].push(v);
  return acc;
}, {} as Record<string, Violation[]>);

// Generate report
const report = {
  summary: {
    total: violations.length,
    byType: Object.entries(byType).map(([type, viols]) => ({ type, count: viols.length })),
    byLayer: Object.entries(byLayer).map(([layer, viols]) => ({ layer, count: viols.length }))
  },
  violations: violations.map(v => ({
    file: v.file,
    layer: v.layer,
    import: v.importPath,
    importLayer: v.importLayer,
    type: v.type,
    message: v.message
  }))
};

// Save to JSON
writeFileSync('violations-report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Report saved to violations-report.json');

// Print summary
console.log('\n=== SUMMARY ===');
console.log(`Total violations: ${report.summary.total}`);
console.log('\nBy Type:');
report.summary.byType.forEach(({ type, count }) => {
  console.log(`  ${type}: ${count}`);
});
console.log('\nBy Layer:');
report.summary.byLayer.forEach(({ layer, count }) => {
  console.log(`  ${layer}: ${count}`);
});
