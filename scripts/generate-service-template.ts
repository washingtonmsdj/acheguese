/**
 * GERADOR DE TEMPLATE DE SERVICE SSOT
 * 
 * Uso: npm run generate:service <nome>
 * Exemplo: npm run generate:service PricingService
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const serviceName = process.argv[2];

if (!serviceName) {
  console.error('❌ Erro: Nome do service é obrigatório');
  console.log('Uso: npm run generate:service <nome>');
  console.log('Exemplo: npm run generate:service PricingService');
  process.exit(1);
}

// Extrair nome base (remover "Service" se presente)
const baseName = serviceName.replace(/Service$/, '');
const tableName = baseName.toLowerCase() + 's';

const serviceTemplate = `/**
 * ${serviceName.toUpperCase()} — SSOT Service
 * 
 * Responsabilidade: Gerenciar ${baseName.toLowerCase()}s do banco de dados
 * 
 * Padrão SSOT:
 * - Única fonte de verdade para ${baseName.toLowerCase()}s
 * - Cache inteligente com TTL
 * - Tratamento de erros consistente
 * - Logging estruturado
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface ${baseName}Row {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ${baseName} {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ══════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class ${serviceName} {
  private static cache: Map<string, ${baseName}> = new Map();
  private static cacheTimestamp: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Buscar todos os ${baseName.toLowerCase()}s ativos
   */
  static async getAll(): Promise<${baseName}[]> {
    try {
      const { data, error } = await supabase
        .from('${tableName}')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar ${baseName.toLowerCase()}s:', error);
        throw new Error(\`Falha ao buscar ${baseName.toLowerCase()}s: \${error.message}\`);
      }

      return (data as ${baseName}Row[]).map(this.mapRowTo${baseName});
    } catch (error) {
      logger.error('Erro inesperado ao buscar ${baseName.toLowerCase()}s:', error);
      throw error;
    }
  }

  /**
   * Buscar ${baseName.toLowerCase()} por ID (com cache)
   */
  static async getById(id: string): Promise<${baseName} | null> {
    // Verificar cache
    if (this.isCacheValid() && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    try {
      const { data, error } = await supabase
        .from('${tableName}')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error(\`Erro ao buscar ${baseName.toLowerCase()} \${id}:\`, error);
        throw new Error(\`Falha ao buscar ${baseName.toLowerCase()}: \${error.message}\`);
      }

      const item = this.mapRowTo${baseName}(data as ${baseName}Row);
      
      // Atualizar cache
      this.cache.set(id, item);
      this.cacheTimestamp = Date.now();

      return item;
    } catch (error) {
      logger.error(\`Erro inesperado ao buscar ${baseName.toLowerCase()} \${id}:\`, error);
      throw error;
    }
  }

  /**
   * Criar novo ${baseName.toLowerCase()}
   */
  static async create(data: {
    name: string;
    description?: string;
  }): Promise<${baseName}> {
    try {
      const { data: created, error } = await supabase
        .from('${tableName}')
        .insert({
          name: data.name,
          description: data.description || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar ${baseName.toLowerCase()}:', error);
        throw new Error(\`Falha ao criar ${baseName.toLowerCase()}: \${error.message}\`);
      }

      // Invalidar cache
      this.clearCache();

      return this.mapRowTo${baseName}(created as ${baseName}Row);
    } catch (error) {
      logger.error('Erro inesperado ao criar ${baseName.toLowerCase()}:', error);
      throw error;
    }
  }

  /**
   * Atualizar ${baseName.toLowerCase()}
   */
  static async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isActive: boolean;
    }>
  ): Promise<${baseName}> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: updated, error } = await supabase
        .from('${tableName}')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(\`Erro ao atualizar ${baseName.toLowerCase()} \${id}:\`, error);
        throw new Error(\`Falha ao atualizar ${baseName.toLowerCase()}: \${error.message}\`);
      }

      // Invalidar cache
      this.clearCache();

      return this.mapRowTo${baseName}(updated as ${baseName}Row);
    } catch (error) {
      logger.error(\`Erro inesperado ao atualizar ${baseName.toLowerCase()} \${id}:\`, error);
      throw error;
    }
  }

  /**
   * Desativar ${baseName.toLowerCase()} (soft delete)
   */
  static async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  /**
   * Limpar cache (útil para testes)
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
  }

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ════════════════════════════════════════════════════════════════════════

  private static isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  private static mapRowTo${baseName}(row: ${baseName}Row): ${baseName} {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
`;

const hookTemplate = `/**
 * HOOK: use${baseName}s
 * 
 * Busca ${baseName.toLowerCase()}s do banco com cache via React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ${serviceName} } from '../services/${serviceName}';
import type { ${baseName} } from '../services/${serviceName}';

// ══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ══════════════════════════════════════════════════════════════════════════

const QUERY_KEYS = {
  all: ['${tableName}'] as const,
  byId: (id: string) => ['${tableName}', id] as const,
};

// ══════════════════════════════════════════════════════════════════════════
// HOOKS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Buscar todos os ${baseName.toLowerCase()}s
 */
export function use${baseName}s() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => ${serviceName}.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Buscar ${baseName.toLowerCase()} por ID
 */
export function use${baseName}(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byId(id),
    queryFn: () => ${serviceName}.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Criar novo ${baseName.toLowerCase()}
 */
export function useCreate${baseName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      ${serviceName}.create(data),
    onSuccess: () => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/**
 * Atualizar ${baseName.toLowerCase()}
 */
export function useUpdate${baseName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<${baseName}>;
    }) => ${serviceName}.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(variables.id) });
    },
  });
}

/**
 * Desativar ${baseName.toLowerCase()}
 */
export function useDeactivate${baseName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ${serviceName}.deactivate(id),
    onSuccess: (_, id) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(id) });
    },
  });
}
`;

const testTemplate = `/**
 * TESTES: ${serviceName}
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ${serviceName} } from './${serviceName}';

// Mock do Supabase
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('${serviceName}', () => {
  beforeEach(() => {
    ${serviceName}.clearCache();
  });

  describe('getAll', () => {
    it('deve buscar todos os ${baseName.toLowerCase()}s ativos', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });
  });

  describe('getById', () => {
    it('deve buscar ${baseName.toLowerCase()} por ID', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });

    it('deve usar cache', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });
  });

  describe('create', () => {
    it('deve criar novo ${baseName.toLowerCase()}', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });
  });

  describe('update', () => {
    it('deve atualizar ${baseName.toLowerCase()}', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('deve desativar ${baseName.toLowerCase()}', async () => {
      // TODO: Implementar teste
      expect(true).toBe(true);
    });
  });
});
`;

// Criar diretórios se não existirem
const serviceDir = join('src', 'core', baseName.toLowerCase(), 'services');
const hookDir = join('src', 'core', baseName.toLowerCase(), 'hooks');
const testDir = join('src', 'core', baseName.toLowerCase(), '__tests__');

try {
  mkdirSync(serviceDir, { recursive: true });
  mkdirSync(hookDir, { recursive: true });
  mkdirSync(testDir, { recursive: true });

  // Criar arquivos
  writeFileSync(join(serviceDir, `${serviceName}.ts`), serviceTemplate);
  writeFileSync(join(hookDir, `use${baseName}s.ts`), hookTemplate);
  writeFileSync(join(testDir, `${serviceName}.test.ts`), testTemplate);

  console.log('✅ Service criado com sucesso!');
  console.log(`\n📁 Arquivos criados:`);
  console.log(`   📄 ${join(serviceDir, serviceName + '.ts')}`);
  console.log(`   📄 ${join(hookDir, 'use' + baseName + 's.ts')}`);
  console.log(`   📄 ${join(testDir, serviceName + '.test.ts')}`);
  console.log('\n📝 Próximos passos:');
  console.log('   1. Revise e ajuste os arquivos gerados');
  console.log('   2. Implemente os testes');
  console.log('   3. Adicione ao index.ts do módulo');
  console.log('   4. Execute os testes: npm test');
} catch (error) {
  console.error('❌ Erro ao criar service:', error);
  process.exit(1);
}
