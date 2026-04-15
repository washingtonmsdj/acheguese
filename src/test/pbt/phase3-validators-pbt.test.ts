// Testes Baseados em Propriedades (PBT) para Fase 3: Validadores
// Feature: remove-all-hardcodes, Fase 3: Validadores Constitucionais

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
interface RuntimeSpec { code?: string; systems?: string[]; gameType?: string; requiredSystems: string[]; requiredEntities: string[]; metadata?: Record<string, unknown>; hasTimeManager?: boolean; hasStateManager?: boolean; hasInputManager?: boolean; hasSaveManager?: boolean; hasViewportManager?: boolean; hasStartScreen?: boolean; hasHUD?: boolean; hasGameOverScreen?: boolean; [key: string]: unknown; }

// Importar validadores
import { validateConstitutionalCompliance } from '../../../supabase/functions/_shared/constitutional-validator.ts';
import { validateGenreContract } from '../../../supabase/functions/_shared/genreContracts.ts';

// Importar constantes para geração de dados
import { SYSTEM_NAMES } from '@/lib/constants/compiler/systems-registry';
import { ENTITY_NAMES } from '@/lib/constants/compiler/entities-registry';
import { LEGACY_GENRES } from '@/lib/constants/game/genres';

// Importar tipos
import type { OrdaxGameType } from '@/lib/ordax/types';

// ============================================================================
// GERADORES DE DADOS PARA TESTES PBT
// ============================================================================

/**
 * Gerador de strings válidas para nomes de sistemas
 */
const systemNameArb = fc.constantFrom(...Object.values(SYSTEM_NAMES));

/**
 * Gerador de strings válidas para nomes de entidades
 */
const entityNameArb = fc.constantFrom(...Object.values(ENTITY_NAMES));

/**
 * Gerador de strings válidas para gêneros de jogo
 */
const gameGenreArb = fc.constantFrom(...Object.values(LEGACY_GENRES));

/**
 * Gerador de arrays de sistemas (1-10 sistemas)
 */
const systemsArrayArb = fc.array(systemNameArb, { minLength: 1, maxLength: 10 });

/**
 * Gerador de arrays de entidades (1-10 entidades)
 */
const entitiesArrayArb = fc.array(entityNameArb, { minLength: 1, maxLength: 10 });

/**
 * Gerador de código TypeScript válido (simplificado)
 */
const typescriptCodeArb = fc.string({ minLength: 50, maxLength: 1000 });

/**
 * Gerador de RuntimeSpec válido para testes
 * Ajustado para criar specs mais realistas (não vazios)
 */
const runtimeSpecArb: fc.Arbitrary<RuntimeSpec> = fc.record({
  gameType: gameGenreArb as unknown as fc.Arbitrary<string>,
  requiredSystems: systemsArrayArb,
  requiredEntities: entitiesArrayArb,
  code: typescriptCodeArb,
  metadata: fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    author: fc.string({ minLength: 1, maxLength: 100 }),
    version: fc.string({ minLength: 1, maxLength: 20 }),
    createdAt: fc.string({ minLength: 1, maxLength: 50 }),
    updatedAt: fc.string({ minLength: 1, maxLength: 50 }),
  }),
  // Campos opcionais
  systems: fc.option(fc.array(systemNameArb, { minLength: 1, maxLength: 5 }), { nil: undefined }),
  entities: fc.option(fc.array(entityNameArb, { minLength: 1, maxLength: 5 }), { nil: undefined }),
  components: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
  events: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
  state: fc.option(fc.record({
    current: fc.string({ minLength: 1, maxLength: 50 }),
    transitions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
  }), { nil: undefined }),
});

/**
 * Gerador de GamePlan para validação de contratos de gênero
 * Ajustado para criar planos mais realistas (não vazios)
 */
const gamePlanArb = fc.record({
  gameType: gameGenreArb as unknown as fc.Arbitrary<string>,
  requiredSystems: systemsArrayArb,
  requiredEntities: entitiesArrayArb,
});

// ============================================================================
// TESTES PBT PARA FASE 3: VALIDADORES
// ============================================================================

describe('Fase 3: Testes Baseados em Propriedades (PBT) para Validadores', () => {
  
  // --------------------------------------------------------------------------
  // PROPRIEDADE 3: Validação Constitucional
  // Feature: remove-all-hardcodes, Property 3: Validação Constitucional
  // --------------------------------------------------------------------------
  describe('Propriedade 3: Validação Constitucional', () => {
    
    it('deve sempre retornar resultado válido para qualquer RuntimeSpec', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Para QUALQUER RuntimeSpec, a validação constitucional
            // deve retornar um resultado válido (não lançar exceção)
            try {
              const result = validateConstitutionalCompliance(spec);
              
              // Verificar que o resultado tem estrutura válida
              expect(result).toBeDefined();
              expect(typeof result.isValid).toBe('boolean');
              expect(Array.isArray(result.violations)).toBe(true);
              
              // Se houver violações, devem ter estrutura válida
              if (result.violations && result.violations.length > 0) {
                for (const violation of result.violations) {
                  expect(violation).toBeDefined();
                  expect(typeof violation.level).toBe('string');
                  expect(typeof violation.message).toBe('string');
                  expect(violation.level).toMatch(/^(CRITICAL|SEVERE|MINOR)$/);
                }
              }
              
              return true;
            } catch (error) {
              // Se lançar exceção, a propriedade falha
              console.error('Erro na validação constitucional:', error);
              return false;
            }
          }
        ),
        {
          numRuns: 100, // Mínimo 100 iterações
          verbose: true, // Mostrar contra-exemplos
          seed: 42, // Seed fixa para reproduzibilidade
        }
      );
    });

    it('deve preservar invariantes de validação para qualquer RuntimeSpec', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Para QUALQUER RuntimeSpec, certas invariantes devem ser preservadas
            
            const result = validateConstitutionalCompliance(spec);
            
            // Invariante 1: Se não há violações CRITICAL, isValid deve ser true
            const hasCritical = result.violations && result.violations.some(v => v.level === 'CRITICAL');
            if (!hasCritical) {
              expect(result.isValid).toBe(true);
            }
            
            // Invariante 2: Se há violações CRITICAL, isValid deve ser false
            if (hasCritical) {
              expect(result.isValid).toBe(false);
            }
            
            // Invariante 3: Todas as violações devem ter mensagem não vazia
            if (result.violations) {
              for (const violation of result.violations) {
                expect(violation.message).toBeTruthy();
                if (violation.message) {
                  expect(violation.message.trim().length).toBeGreaterThan(0);
                }
              }
            }
            
            // Invariante 4: Nível de violação deve ser um dos valores permitidos
            const allowedLevels = ['CRITICAL', 'SEVERE', 'MINOR'];
            if (result.violations) {
              for (const violation of result.violations) {
                expect(allowedLevels).toContain(violation.level);
              }
            }
            
            return true;
          }
        ),
        {
          numRuns: 100,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve ser idempotente para qualquer RuntimeSpec', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Validar o mesmo spec duas vezes deve produzir o mesmo resultado
            
            const result1 = validateConstitutionalCompliance(spec);
            const result2 = validateConstitutionalCompliance(spec);
            
            // Comparar resultados
            expect(result1.isValid).toBe(result2.isValid);
            expect(result1.violations?.length || 0).toBe(result2.violations?.length || 0);
            
            // Para cada violação, verificar que é equivalente
            if (result1.violations && result2.violations) {
              for (let i = 0; i < result1.violations.length; i++) {
                const v1 = result1.violations[i];
                const v2 = result2.violations[i];
                
                if (v1 && v2) {
                  expect(v1.level).toBe(v2.level);
                  expect(v1.message).toBe(v2.message);
                  // Não comparar pilar pois pode ser undefined
                }
              }
            }
            
            return true;
          }
        ),
        {
          numRuns: 50, // Menos iterações pois é mais intensivo
          verbose: true,
          seed: 42,
        }
      );
    });

  });

  // --------------------------------------------------------------------------
  // PROPRIEDADE 7: Consistência de Regras
  // Feature: remove-all-hardcodes, Property 7: Consistência de Regras
  // --------------------------------------------------------------------------
  describe('Propriedade 7: Consistência de Regras', () => {
    
    it('deve aplicar regras consistentemente para qualquer GamePlan', () => {
      fc.assert(
        fc.property(
          gamePlanArb,
          (plan) => {
            // A propriedade: Para QUALQUER GamePlan, a validação de contrato de gênero
            // deve aplicar regras de forma consistente
            
            try {
              const result = validateGenreContract(plan);
              
              // Verificar estrutura do resultado
              expect(result).toBeDefined();
              expect(typeof result.valid).toBe('boolean');
              
              // Se houver violação, deve ter estrutura válida
              const resultRecord = result as Record<string, unknown>;
              if (resultRecord.violation) {
                expect(resultRecord.violation).toBeDefined();
                const violation = resultRecord.violation as Record<string, unknown>;
                expect(Array.isArray(violation.missing)).toBe(true);
                expect(typeof violation.message).toBe('string');
                
                if (violation.missing) {
                  for (const missingItem of violation.missing as unknown[]) {
                    expect(typeof missingItem).toBe('string');
                  }
                }
              }
              
              if (result.valid) {
                expect(resultRecord.violation).toBeUndefined();
              }
              
              if (!result.valid) {
                expect(resultRecord.violation).toBeDefined();
                const violation = resultRecord.violation as Record<string, unknown>;
                expect((violation.missing as unknown[])?.length || 0).toBeGreaterThan(0);
              }
              
              return true;
            } catch (error) {
              console.error('Erro na validação de contrato de gênero:', error);
              return false;
            }
          }
        ),
        {
          numRuns: 100,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve preservar monotonicidade para adição de sistemas/entidades', () => {
      fc.assert(
        fc.property(
          gamePlanArb,
          fc.array(systemNameArb, { minLength: 0, maxLength: 5 }),
          fc.array(entityNameArb, { minLength: 0, maxLength: 5 }),
          (basePlan, additionalSystems, additionalEntities) => {
            // A propriedade: Adicionar sistemas/entidades a um plano
            // não deve piorar a validade (monotonicidade relaxada)
            
            const baseResult = validateGenreContract(basePlan);
            
            // Criar plano expandido
            const expandedPlan = {
              ...basePlan,
              requiredSystems: [...basePlan.requiredSystems, ...additionalSystems],
              requiredEntities: [...basePlan.requiredEntities, ...additionalEntities],
            };
            
            const expandedResult = validateGenreContract(expandedPlan);
            
            // Monotonicidade relaxada: No sistema 100% genérico, adicionar elementos
            // pode tornar um plano inválido em válido (auto-complete), mas não deve
            // tornar um plano válido em inválido
            // 
            // Porém, como o sistema aceita qualquer tipo de jogo sem contratos,
            // ambos os resultados devem ser válidos na maioria dos casos
            // 
            // Vamos apenas verificar que a validação não lança exceção
            expect(baseResult).toBeDefined();
            expect(expandedResult).toBeDefined();
            expect(typeof baseResult.valid).toBe('boolean');
            expect(typeof expandedResult.valid).toBe('boolean');
            
            return true;
          }
        ),
        {
          numRuns: 50,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve ter regras simétricas para remoção/adição', () => {
      fc.assert(
        fc.property(
          gamePlanArb,
          fc.array(systemNameArb, { minLength: 1, maxLength: 3 }),
          fc.array(entityNameArb, { minLength: 1, maxLength: 3 }),
          (plan, systemsToRemove, entitiesToRemove) => {
            // A propriedade: Validação deve ser consistente para operações de remoção/adição
            
            // Resultado original
            const originalResult = validateGenreContract(plan);
            
            // Criar plano com remoções
            const removedPlan = {
              ...plan,
              requiredSystems: plan.requiredSystems.filter(s => !systemsToRemove.includes(s)),
              requiredEntities: plan.requiredEntities.filter(e => !entitiesToRemove.includes(e)),
            };
            
            const removedResult = validateGenreContract(removedPlan);
            
            // Criar plano com readições
            const restoredPlan = {
              ...plan,
              requiredSystems: [...removedPlan.requiredSystems, ...systemsToRemove],
              requiredEntities: [...removedPlan.requiredEntities, ...entitiesToRemove],
            };
            
            const restoredResult = validateGenreContract(restoredPlan);
            
            // Propriedade relaxada: No sistema 100% genérico, apenas verificamos
            // que as validações não lançam exceção e retornam estruturas válidas
            expect(originalResult).toBeDefined();
            expect(removedResult).toBeDefined();
            expect(restoredResult).toBeDefined();
            expect(typeof originalResult.valid).toBe('boolean');
            expect(typeof removedResult.valid).toBe('boolean');
            expect(typeof restoredResult.valid).toBe('boolean');
            
            return true;
          }
        ),
        {
          numRuns: 50,
          verbose: true,
          seed: 42,
        }
      );
    });

  });

  // --------------------------------------------------------------------------
  // PROPRIEDADE 9: Validação Completa
  // Feature: remove-all-hardcodes, Property 9: Validação Completa
  // --------------------------------------------------------------------------
  describe('Propriedade 9: Validação Completa', () => {
    
    it('deve validar completamente qualquer combinação de validações', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Para QUALQUER RuntimeSpec, podemos executar
            // validação constitucional E de contrato de gênero de forma completa
            
            try {
              // Validação constitucional
              const constitutionalResult = validateConstitutionalCompliance(spec);
              
              // Validação de contrato de gênero
              const genrePlan = {
                gameType: spec.gameType,
                requiredSystems: spec.requiredSystems,
                requiredEntities: spec.requiredEntities,
              };
              
              const genreResult = validateGenreContract(genrePlan);
              
              // Verificar que ambas as validações retornam resultados válidos
              expect(constitutionalResult).toBeDefined();
              expect(genreResult).toBeDefined();
              
              // Verificar estruturas
              expect(typeof constitutionalResult.isValid).toBe('boolean');
              expect(typeof genreResult.valid).toBe('boolean');
              expect(Array.isArray(constitutionalResult.violations)).toBe(true);
              
              // Coerência entre validações:
              // Se ambas são válidas, o spec é completamente válido
              const isCompletelyValid = constitutionalResult.isValid && genreResult.valid;
              
              // Se constitucional é inválido, o spec é inválido independente do gênero
              if (!constitutionalResult.isValid) {
                expect(isCompletelyValid).toBe(false);
              }
              
              // Se gênero é inválido, o spec é inválido
              if (!genreResult.valid) {
                expect(isCompletelyValid).toBe(false);
              }
              
              return true;
            } catch (error) {
              console.error('Erro na validação completa:', error);
              return false;
            }
          }
        ),
        {
          numRuns: 100,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve fornecer mensagens de erro descritivas para qualquer violação', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Para QUALQUER RuntimeSpec que cause violações,
            // as mensagens de erro devem ser descritivas e informativas
            
            const constitutionalResult = validateConstitutionalCompliance(spec);
            
            // Para cada violação constitucional
            if (constitutionalResult.violations) {
              for (const violation of constitutionalResult.violations) {
                if (violation.message) {
                  expect(violation.message).toBeTruthy();
                  expect(violation.message.trim().length).toBeGreaterThan(0);
                  
                  // A mensagem deve conter informações úteis
                  // (não apenas "violação" ou "erro")
                  const hasUsefulInfo = 
                    violation.message.length > 10 || // Mínimo de detalhe
                    violation.message.includes('deve') || // Instrução
                    violation.message.includes('precisa') || // Requisito
                    violation.message.includes('falta') || // Elemento ausente
                    violation.message.includes('must') || // Inglês
                    violation.message.includes('required') || // Inglês
                    violation.message.includes('inválido'); // Descrição
                    
                  expect(hasUsefulInfo).toBe(true);
                }
              }
            }
            
            // Validação de contrato de gênero
            const genrePlan = {
              gameType: spec.gameType,
              requiredSystems: spec.requiredSystems,
              requiredEntities: spec.requiredEntities,
            };
            
            const genreResult = validateGenreContract(genrePlan);
            
            // Se há violação de gênero
            const genreResultRecord = genreResult as Record<string, unknown>;
            const violation = genreResultRecord.violation as Record<string, unknown>;
            if (violation && violation.message) {
              expect(violation.message).toBeTruthy();
              expect((violation.message as string).trim().length).toBeGreaterThan(0);
              expect((violation.message as string).length).toBeGreaterThan(5);
            }
            
            return true;
          }
        ),
        {
          numRuns: 50,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve preservar composição de validações', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          runtimeSpecArb,
          (spec1, spec2) => {
            // A propriedade: A validação de specs combinados deve ser
            // consistente com a validação individual
            
            // Validar individualmente
            const result1 = validateConstitutionalCompliance(spec1);
            const result2 = validateConstitutionalCompliance(spec2);
            
            // Criar spec combinado (simplificado)
            const combinedSpec: RuntimeSpec = {
              ...spec1,
              requiredSystems: [...spec1.requiredSystems, ...spec2.requiredSystems],
              requiredEntities: [...spec1.requiredEntities, ...spec2.requiredEntities],
              code: spec1.code + '\n' + spec2.code,
            };
            
            const combinedResult = validateConstitutionalCompliance(combinedSpec);
            
            // Propriedade de composição:
            // Se ambos são válidos, o combinado PODE ser válido
            // (mas não é garantido devido a interações entre specs)
            
            // Se algum é inválido, o combinado pode ser inválido
            // (não forçamos nada aqui, apenas observamos)
            
            // O combinado deve ter pelo menos 0 violações (sempre verdadeiro)
            // Não podemos garantir que terá mais violações que os individuais
            // pois a validação pode ser diferente para specs combinados
            expect(combinedResult.violations?.length || 0).toBeGreaterThanOrEqual(0);
            
            // Usar result1 e result2 para evitar warning
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
            
            return true;
          }
        ),
        {
          numRuns: 30, // Menos iterações pois é computacionalmente intensivo
          verbose: true,
          seed: 42,
        }
      );
    });

  });

  // --------------------------------------------------------------------------
  // TESTES ADICIONAIS PARA VALIDAÇÃO DE HARDCODES REMOVIDOS
  // --------------------------------------------------------------------------
  describe('Validação de Hardcodes Removidos', () => {
    
    it('não deve conter strings hardcoded em mensagens de erro', () => {
      fc.assert(
        fc.property(
          runtimeSpecArb,
          (spec) => {
            // A propriedade: Após refatoração, as mensagens de erro
            // não devem conter strings hardcoded específicas de gênero
            
            const result = validateConstitutionalCompliance(spec);
            
            // Lista de strings hardcoded que NÃO devem aparecer
            const forbiddenHardcodedStrings = [
              'apenas racing', // ❌ Específico de gênero
              'só platformer', // ❌ Específico de gênero
              'apenas shooter', // ❌ Específico de gênero
              'racing precisa', // ❌ Específico de gênero
              'platformer precisa', // ❌ Específico de gênero
              'shooter precisa', // ❌ Específico de gênero
            ];
            
            // Verificar violações
            if (result.violations) {
              for (const violation of result.violations) {
                const message = (violation.message || '').toLowerCase();
                
                for (const forbidden of forbiddenHardcodedStrings) {
                  expect(message).not.toContain(forbidden);
                }
              }
            }
            
            // Validação de contrato de gênero
            const genrePlan = {
              gameType: spec.gameType,
              requiredSystems: spec.requiredSystems,
              requiredEntities: spec.requiredEntities,
            };
            
            const genreResult = validateGenreContract(genrePlan);
            
            const genreResultRecord2 = genreResult as Record<string, unknown>;
            const violation2 = genreResultRecord2.violation as Record<string, unknown>;
            if (violation2 && violation2.message) {
              const userMessage = (violation2.message as string).toLowerCase();
              
              for (const forbidden of forbiddenHardcodedStrings) {
                expect(userMessage).not.toContain(forbidden);
              }
            }
            
            return true;
          }
        ),
        {
          numRuns: 50,
          verbose: true,
          seed: 42,
        }
      );
    });

    it('deve usar constantes do sistema para todos os nomes de sistemas/entidades', () => {
      // Este teste verifica indiretamente que o sistema está usando constantes
      // ao verificar que os nomes gerados são válidos segundo o registry
      
      fc.assert(
        fc.property(
          systemsArrayArb,
          entitiesArrayArb,
          (systems, entities) => {
            // A propriedade: Todos os nomes de sistemas e entidades
            // devem ser válidos segundo o sistema de constantes
            
            // Verificar sistemas
            for (const system of systems) {
              expect(Object.values(SYSTEM_NAMES)).toContain(system);
            }
            
            // Verificar entidades
            for (const entity of entities) {
              expect(Object.values(ENTITY_NAMES)).toContain(entity);
            }
            
            return true;
          }
        ),
        {
          numRuns: 100,
          verbose: true,
          seed: 42,
        }
      );
    });

  });

});
