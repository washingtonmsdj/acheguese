/**
 * Constantes de Validação do Compilador
 * 
 * Sistema centralizado de constantes para validação no compilador Ordax.
 */

import { z } from 'zod';

// Schemas de validação
export const ValidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  category: z.enum(['constitutional', 'genre', 'technical', 'performance', 'security']),
  condition: z.string(), // Expressão JavaScript para avaliação
  message: z.string(),
  fix: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  ruleId: z.string(),
  passed: z.boolean(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  data: z.record(z.any()).optional(),
});

export type ValidationRule = z.infer<typeof ValidationRuleSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Regras de validação constitucional
export const CONSTITUTIONAL_RULES: ValidationRule[] = [
  {
    id: 'CONST_001',
    name: 'Jogo Deve Ter Objetivo',
    description: 'Todo jogo deve ter pelo menos um objetivo claro',
    severity: 'error',
    category: 'constitutional',
    condition: 'spec.objectives && spec.objectives.length > 0',
    message: 'Jogo deve ter pelo menos um objetivo definido',
    fix: 'Adicione pelo menos um objetivo ao jogo',
  },
  {
    id: 'CONST_002',
    name: 'Jogo Deve Ter Mecânica',
    description: 'Todo jogo deve ter pelo menos uma mecânica principal',
    severity: 'error',
    category: 'constitutional',
    condition: 'spec.mechanics && spec.mechanics.length > 0',
    message: 'Jogo deve ter pelo menos uma mecânica definida',
    fix: 'Adicione pelo menos uma mecânica ao jogo',
  },
  {
    id: 'CONST_003',
    name: 'Jogo Deve Ser Jogável',
    description: 'Jogo deve ser tecnicamente jogável',
    severity: 'error',
    category: 'constitutional',
    condition: 'spec.technical && spec.technical.playable !== false',
    message: 'Jogo deve ser tecnicamente jogável',
    fix: 'Garanta que o jogo seja tecnicamente implementável',
  },
  {
    id: 'CONST_004',
    name: 'Jogo Deve Ser Ético',
    description: 'Jogo não deve violar regras éticas',
    severity: 'error',
    category: 'constitutional',
    condition: '!spec.violatesEthics',
    message: 'Jogo viola regras éticas',
    fix: 'Remova conteúdo que viole regras éticas',
  },
  {
    id: 'CONST_005',
    name: 'Jogo Deve Ser Acessível',
    description: 'Jogo deve ter opções de acessibilidade básicas',
    severity: 'warning',
    category: 'constitutional',
    condition: 'spec.accessibility && spec.accessibility.basic === true',
    message: 'Considere adicionar opções de acessibilidade básicas',
    fix: 'Adicione opções como tamanho de texto ajustável e suporte a controles alternativos',
  },
];

// Regras de validação por gênero
export const GENRE_RULES: Record<string, ValidationRule[]> = {
  platformer: [
    {
      id: 'GENRE_PLAT_001',
      name: 'Plataformas Devem Ser Acessíveis',
      description: 'Em jogos de plataforma, saltos devem ser possíveis',
      severity: 'error',
      category: 'genre',
      condition: 'spec.mechanics.some(m => m.type === "jump" || m.type === "platforming")',
      message: 'Jogos de plataforma devem ter mecânica de salto',
      fix: 'Adicione mecânica de salto ao jogo',
    },
    {
      id: 'GENRE_PLAT_002',
      name: 'Checkpoints Adequados',
      description: 'Jogos de plataforma devem ter checkpoints razoáveis',
      severity: 'warning',
      category: 'genre',
      condition: 'spec.checkpoints && spec.checkpoints.distance < 100',
      message: 'Checkpoints muito distantes podem frustrar jogadores',
      fix: 'Adicione checkpoints mais frequentes',
    },
  ],
  racing: [
    {
      id: 'GENRE_RAC_001',
      name: 'Controles de Direção',
      description: 'Jogos de corrida devem ter controles de direção',
      severity: 'error',
      category: 'genre',
      condition: 'spec.mechanics.some(m => m.type === "steering" || m.type === "driving")',
      message: 'Jogos de corrida devem ter mecânica de direção',
      fix: 'Adicione mecânica de direção ao jogo',
    },
    {
      id: 'GENRE_RAC_002',
      name: 'Velocidade Adequada',
      description: 'Jogos de corrida devem ter senso de velocidade',
      severity: 'warning',
      category: 'genre',
      condition: 'spec.physics && spec.physics.speed > 50',
      message: 'Velocidade muito baixa para jogo de corrida',
      fix: 'Aumente a velocidade base do jogo',
    },
  ],
  shooter: [
    {
      id: 'GENRE_SHOOT_001',
      name: 'Mecânica de Tiro',
      description: 'Jogos de tiro devem ter mecânica de tiro',
      severity: 'error',
      category: 'genre',
      condition: 'spec.mechanics.some(m => m.type === "shoot" || m.type === "aim")',
      message: 'Jogos de tiro devem ter mecânica de tiro',
      fix: 'Adicione mecânica de tiro ao jogo',
    },
    {
      id: 'GENRE_SHOOT_002',
      name: 'Balanceamento de Dano',
      description: 'Dano deve ser balanceado',
      severity: 'warning',
      category: 'genre',
      condition: 'spec.balance && spec.balance.damage > 0 && spec.balance.damage < 1000',
      message: 'Dano pode estar desbalanceado',
      fix: 'Ajuste valores de dano para balanceamento',
    },
  ],
  puzzle: [
    {
      id: 'GENRE_PUZ_001',
      name: 'Lógica de Puzzle',
      description: 'Jogos de puzzle devem ter lógica clara',
      severity: 'error',
      category: 'genre',
      condition: 'spec.mechanics.some(m => m.type === "puzzle" || m.type === "logic")',
      message: 'Jogos de puzzle devem ter mecânica de puzzle',
      fix: 'Adicione mecânica de puzzle ao jogo',
    },
    {
      id: 'GENRE_PUZ_002',
      name: 'Dificuldade Progressiva',
      description: 'Puzzles devem aumentar em dificuldade',
      severity: 'warning',
      category: 'genre',
      condition: 'spec.difficulty && spec.difficulty.progression === true',
      message: 'Considere adicionar progressão de dificuldade',
      fix: 'Adicione aumento gradual de dificuldade nos puzzles',
    },
  ],
  rpg: [
    {
      id: 'GENRE_RPG_001',
      name: 'Sistema de Progressão',
      description: 'RPGs devem ter sistema de progressão',
      severity: 'error',
      category: 'genre',
      condition: 'spec.mechanics.some(m => m.type === "level" || m.type === "experience")',
      message: 'RPGs devem ter sistema de progressão (níveis, experiência)',
      fix: 'Adicione sistema de progressão ao jogo',
    },
    {
      id: 'GENRE_RPG_002',
      name: 'História ou Narrativa',
      description: 'RPGs devem ter elementos narrativos',
      severity: 'warning',
      category: 'genre',
      condition: 'spec.story || spec.narrative',
      message: 'RPGs geralmente beneficiam-se de elementos narrativos',
      fix: 'Considere adicionar história ou elementos narrativos',
    },
  ],
};

// Regras de validação técnica
export const TECHNICAL_RULES: ValidationRule[] = [
  {
    id: 'TECH_001',
    name: 'Performance Aceitável',
    description: 'Jogo deve ter performance aceitável',
    severity: 'warning',
    category: 'technical',
    condition: 'spec.performance && spec.performance.fps >= 30',
    message: 'Performance pode ser insuficiente para experiência fluida',
    fix: 'Otimize assets e código para melhor performance',
  },
  {
    id: 'TECH_002',
    name: 'Compatibilidade de Plataforma',
    description: 'Jogo deve ser compatível com plataforma alvo',
    severity: 'error',
    category: 'technical',
    condition: 'spec.platform && ["web", "desktop", "mobile"].includes(spec.platform)',
    message: 'Plataforma alvo não suportada',
    fix: 'Escolha plataforma suportada: web, desktop ou mobile',
  },
  {
    id: 'TECH_003',
    name: 'Tamanho de Assets',
    description: 'Assets não devem exceder limites de tamanho',
    severity: 'warning',
    category: 'technical',
    condition: 'spec.assets && spec.assets.totalSize < 100 * 1024 * 1024', // 100MB
    message: 'Assets podem exceder limites de tamanho recomendados',
    fix: 'Otimize assets (compressão, LOD, streaming)',
  },
  {
    id: 'TECH_004',
    name: 'Dependências Suportadas',
    description: 'Dependências devem ser suportadas',
    severity: 'error',
    category: 'technical',
    condition: 'spec.dependencies && spec.dependencies.every(d => d.supported === true)',
    message: 'Algumas dependências não são suportadas',
    fix: 'Remova ou substitua dependências não suportadas',
  },
];

// Limites de validação
export const VALIDATION_LIMITS = {
  MAX_OBJECTIVES: 10,
  MAX_MECHANICS: 20,
  MAX_ENTITIES: 1000,
  MAX_SYSTEMS: 50,
  MAX_ASSET_SIZE_MB: 100,
  MIN_FPS: 30,
  MAX_COMPLEXITY_SCORE: 1000,
} as const;

// Configurações de validação
export const VALIDATION_CONFIG = {
  ENABLE_CONSTITUTIONAL: true,
  ENABLE_GENRE: true,
  ENABLE_TECHNICAL: true,
  ENABLE_PERFORMANCE: true,
  ENABLE_SECURITY: true,
  MAX_ERRORS: 10,
  MAX_WARNINGS: 50,
  STOP_ON_CRITICAL_ERROR: true,
  GENERATE_REPORT: true,
  SUGGEST_FIXES: true,
} as const;

// Funções utilitárias
export function getValidationRulesForGenre(genre: string): ValidationRule[] {
  const genreRules = GENRE_RULES[genre] || [];
  return [...CONSTITUTIONAL_RULES, ...genreRules, ...TECHNICAL_RULES];
}

export function getAllValidationRules(): ValidationRule[] {
  const allRules = [...CONSTITUTIONAL_RULES, ...TECHNICAL_RULES];
  
  // Adiciona regras de todos os gêneros (únicas por ID)
  const ruleIds = new Set(allRules.map(r => r.id));
  
  Object.values(GENRE_RULES).forEach(rules => {
    rules.forEach(rule => {
      if (!ruleIds.has(rule.id)) {
        allRules.push(rule);
        ruleIds.add(rule.id);
      }
    });
  });
  
  return allRules;
}

export function validateSpecAgainstRules(spec: unknown, rules: ValidationRule[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const rule of rules) {
    try {
      // Avalia a condição (simplificado - em produção usar eval seguro ou parser)
      const passed = evalRuleCondition(rule.condition, spec);
      
      results.push({
        ruleId: rule.id,
        passed,
        message: passed ? `Regra ${rule.id} passou` : rule.message,
        severity: rule.severity,
        data: { condition: rule.condition, spec },
      });
    } catch (error) {
      results.push({
        ruleId: rule.id,
        passed: false,
        message: `Erro ao avaliar regra ${rule.id}: ${error}`,
        severity: 'error',
        data: { error: String(error), condition: rule.condition },
      });
    }
  }
  
  return results;
}

function evalRuleCondition(condition: string, spec: unknown): boolean {
  // Implementação simplificada - em produção usar parser seguro
  // Exemplo: converter "spec.objectives && spec.objectives.length > 0" para avaliação
  try {
    // Cria contexto seguro para eval
    const context = { spec };
    const func = new Function('spec', `return ${condition}`);
    return func(spec);
  } catch {
    return false;
  }
}

export function hasCriticalErrors(results: ValidationResult[]): boolean {
  return results.some(r => !r.passed && r.severity === 'error');
}

export function getValidationSummary(results: ValidationResult[]): {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
  infos: number;
} {
  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    errors: results.filter(r => !r.passed && r.severity === 'error').length,
    warnings: results.filter(r => !r.passed && r.severity === 'warning').length,
    infos: results.filter(r => !r.passed && r.severity === 'info').length,
  };
}

// Validação
export function validateValidationRule(rule: unknown): ValidationRule {
  return ValidationRuleSchema.parse(rule);
}

export function validateValidationRuleSafe(rule: unknown): ValidationRule | null {
  try {
    return ValidationRuleSchema.parse(rule);
  } catch {
    return null;
  }
}