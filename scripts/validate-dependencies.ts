import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface DependencyNode {
  path: string;
  layer: string;
  module?: string;
  imports: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  graph: Map<string, DependencyNode>;
  legacyImports?: Map<string, number>;
}

const LAYER_ORDER = {
  'integrations': 0,
  'shared': 1,
  'core': 2,
  'modules': 3,
  'app': 4
};

const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  'app': ['app', 'modules', 'core', 'shared'],
  'modules': ['modules', 'core', 'shared'],  // modules can import from same layer (different submodules via barrel exports)
  'core': ['core', 'integrations', 'shared'],  // core can import from core (different subsystems)
  'shared': ['shared'],  // shared can import from shared (UI components, utils, types)
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

function extractImports(content: string, filePath: string): string[] {
  const imports: string[] = [];
  
  // Remove comentários de linha única e multi-linha antes de processar
  const contentWithoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/\/\/.*/g, ''); // Remove // comments
  
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(contentWithoutComments)) !== null) {
    const importPath = match[1];
    
    // Only track internal imports starting with @/
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
        // Skip node_modules and dist
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
  
  console.log(`Found ${files.length} TypeScript files`);
  
  for (const file of files) {
    const fullPath = join(srcDir, file);
    const layer = getLayer(file);
    
    if (!layer) continue;
    
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const imports = extractImports(content, file);
      
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

function detectCircularDependencies(graph: Map<string, DependencyNode>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(file: string, path: string[]): void {
    if (recursionStack.has(file)) {
      // Found a cycle - only report if it's not a self-reference
      const cycleStart = path.indexOf(file);
      if (cycleStart !== -1 && cycleStart < path.length - 1) {
        const cycle = [...path.slice(cycleStart), file];
        // Only add unique cycles (not duplicates or self-references)
        if (cycle.length > 2) {
          const cycleKey = cycle.sort().join('|');
          if (!cycles.some(c => c.sort().join('|') === cycleKey)) {
            cycles.push(cycle);
          }
        }
      }
      return;
    }
    
    if (visited.has(file)) {
      return;
    }
    
    visited.add(file);
    recursionStack.add(file);
    path.push(file);
    
    const node = graph.get(file);
    if (!node) {
      recursionStack.delete(file);
      return;
    }
    
    for (const importPath of node.imports) {
      // Find files that could match this import
      for (const [targetFile, targetNode] of graph.entries()) {
        if (targetFile === file) continue; // Skip self
        
        const importLayer = importPath.split('/')[1];
        const importRest = importPath.substring(importLayer.length + 3); // Remove @/layer/
        
        if (targetNode.layer === importLayer && targetFile.includes(importRest)) {
          dfs(targetFile, [...path]);
        }
      }
    }
    
    recursionStack.delete(file);
  }
  
  for (const file of graph.keys()) {
    visited.clear();
    recursionStack.clear();
    dfs(file, []);
  }
  
  return cycles;
}

function validateDependencyRules(graph: Map<string, DependencyNode>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const legacyImports = new Map<string, number>();
  
  for (const [file, node] of graph.entries()) {
    for (const importPath of node.imports) {
      const importLayer = importPath.split('/')[1];
      
      // Track legacy imports (old architecture paths)
      if (['components', 'services', 'hooks', 'types', 'lib', 'contexts', 'stores', 'validation'].includes(importLayer)) {
        legacyImports.set(importLayer, (legacyImports.get(importLayer) || 0) + 1);
        continue; // Don't report as errors - these are migration TODOs
      }
      
      // Check for cross-module imports (modules importing from other modules)
      if (node.layer === 'modules' && importLayer === 'modules') {
        const sourceModule = node.module;
        const targetModuleMatch = importPath.match(/@\/modules\/([^/]+)/);
        const targetModule = targetModuleMatch ? targetModuleMatch[1] : null;
        
        if (sourceModule && targetModule && sourceModule !== targetModule) {
          errors.push(
            `❌ Cross-module import: ${file}\n` +
            `   Module "${sourceModule}" cannot import from module "${targetModule}"\n` +
            `   Import: ${importPath}\n` +
            `   Solution: Move shared logic to @/core or use events`
          );
        }
        continue; // Skip further validation for same-layer module imports
      }
      
      // Check if this is an allowed dependency
      const allowedLayers = ALLOWED_DEPENDENCIES[node.layer] || [];
      
      if (!allowedLayers.includes(importLayer)) {
        errors.push(
          `❌ Invalid dependency: ${file}\n` +
          `   Layer "${node.layer}" cannot import from "${importLayer}"\n` +
          `   Import: ${importPath}\n` +
          `   Allowed: ${allowedLayers.join(', ') || 'none'}`
        );
      }
      
      // Check for direct Supabase imports (external library)
      if (importPath.includes('@supabase/supabase-js')) {
        errors.push(
          `❌ Direct Supabase import: ${file}\n` +
          `   Use @/integrations/supabase or @/core/* services instead\n` +
          `   Import: ${importPath}`
        );
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    graph,
    legacyImports
  };
}

function generateReport(result: ValidationResult): void {
  console.log('\n=== Dependency Graph Validation Report ===\n');
  
  // Count nodes by layer
  const layerCounts = new Map<string, number>();
  for (const node of result.graph.values()) {
    layerCounts.set(node.layer, (layerCounts.get(node.layer) || 0) + 1);
  }
  
  console.log('📊 Files by Layer:');
  for (const [layer, count] of layerCounts.entries()) {
    console.log(`   ${layer}: ${count} files`);
  }
  console.log();
  
  // Legacy imports
  if (result.legacyImports && result.legacyImports.size > 0) {
    console.log('⚠️  Legacy Import Paths (Migration TODO):');
    for (const [path, count] of result.legacyImports.entries()) {
      console.log(`   @/${path}: ${count} imports`);
    }
    console.log();
  }
  
  // Check for circular dependencies
  console.log('🔄 Checking for circular dependencies...');
  const cycles = detectCircularDependencies(result.graph);
  if (cycles.length > 0) {
    console.log(`   ⚠️  Found ${cycles.length} potential circular dependencies`);
    console.log('   (Note: Some may be false positives due to import resolution)');
    if (cycles.length <= 5) {
      for (const cycle of cycles) {
        console.log(`   ${cycle.join(' → ')}`);
      }
    }
  } else {
    console.log('   ✅ No circular dependencies detected');
  }
  console.log();
  
  // Validation results
  console.log('🔍 Dependency Rule Validation:');
  if (result.errors.length === 0) {
    console.log('   ✅ All dependency rules are satisfied');
  } else {
    console.log(`   ❌ Found ${result.errors.length} violations:\n`);
    // Show ALL violations for complete analysis
    for (const error of result.errors) {
      console.log(error);
      console.log();
    }
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of result.warnings) {
      console.log(`   ${warning}`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total files analyzed: ${result.graph.size}`);
  console.log(`Circular dependencies: ${cycles.length}`);
  console.log(`Architecture violations: ${result.errors.length}`);
  console.log(`Legacy imports: ${result.legacyImports ? Array.from(result.legacyImports.values()).reduce((a, b) => a + b, 0) : 0}`);
  console.log(`Warnings: ${result.warnings.length}`);
  
  const hasLegacy = result.legacyImports && result.legacyImports.size > 0;
  if (result.valid && cycles.length === 0) {
    console.log(`Status: ✅ PASSED ${hasLegacy ? '(with legacy imports to migrate)' : ''}`);
  } else {
    console.log(`Status: ❌ FAILED`);
  }
  console.log();
}

// Main execution
const srcDir = join(process.cwd(), 'src');
console.log('Building dependency graph...');
const graph = buildDependencyGraph(srcDir);
console.log(`Analyzed ${graph.size} files`);

const result = validateDependencyRules(graph);
generateReport(result);

// Exit with error code if validation failed
if (!result.valid || detectCircularDependencies(graph).length > 0) {
  process.exit(1);
}
