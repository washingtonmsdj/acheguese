/**
 * Constantes de Erros do Compilador
 * 
 * Sistema centralizado de códigos de erro, mensagens e tratamento para o compilador Ordax.
 */

import { z } from 'zod';

// Schemas de validação
export const ErrorCodeSchema = z.object({
  code: z.string(),
  category: z.enum(['validation', 'generation', 'runtime', 'network', 'system']),
  severity: z.enum(['fatal', 'error', 'warning', 'info']),
  message: z.string(),
  description: z.string(),
  possibleCauses: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
  httpStatus: z.number().int().min(100).max(599).optional(),
});

export const ErrorContextSchema = z.object({
  phase: z.string(),
  component: z.string(),
  spec: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
  timestamp: z.number(),
});

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ErrorContext = z.infer<typeof ErrorContextSchema>;

// Códigos de erro do compilador
export const COMPILER_ERRORS: Record<string, ErrorCode> = {
  // Erros de validação (VAL_xxx)
  VAL_001: {
    code: 'VAL_001',
    category: 'validation',
    severity: 'error',
    message: 'Spec inválida: objetivo não definido',
    description: 'A spec do jogo não contém um objetivo definido',
    possibleCauses: [
      'Usuário não especificou objetivo',
      'Parser não conseguiu extrair objetivo',
      'Objetivo está em formato não reconhecido',
    ],
    suggestedFixes: [
      'Solicite ao usuário que defina um objetivo claro',
      'Use heurísticas para inferir objetivo da descrição',
      'Ofereça objetivos padrão baseados no gênero',
    ],
    httpStatus: 400,
  },
  
  VAL_002: {
    code: 'VAL_002',
    category: 'validation',
    severity: 'error',
    message: 'Spec inválida: mecânica não definida',
    description: 'A spec do jogo não contém mecânicas definidas',
    possibleCauses: [
      'Usuário não especificou mecânicas',
      'Mecânicas estão em formato não reconhecido',
      'Parser falhou ao extrair mecânicas',
    ],
    suggestedFixes: [
      'Solicite ao usuário que defina pelo menos uma mecânica',
      'Inferir mecânicas baseadas no gênero e objetivo',
      'Oferecer mecânicas padrão para o gênero',
    ],
    httpStatus: 400,
  },
  
  VAL_003: {
    code: 'VAL_003',
    category: 'validation',
    severity: 'error',
    message: 'Violação de regra constitucional',
    description: 'A spec viola uma ou mais regras constitucionais',
    possibleCauses: [
      'Spec contém conteúdo não ético',
      'Spec não é tecnicamente implementável',
      'Spec viola diretrizes de acessibilidade',
    ],
    suggestedFixes: [
      'Revisar e ajustar spec para conformidade',
      'Explicar regras constitucionais ao usuário',
      'Oferecer alternativas conformes',
    ],
    httpStatus: 400,
  },
  
  VAL_004: {
    code: 'VAL_004',
    category: 'validation',
    severity: 'warning',
    message: 'Violação de regra de gênero',
    description: 'A spec não segue convenções do gênero especificado',
    possibleCauses: [
      'Mecânicas incompatíveis com gênero',
      'Estética não condizente com gênero',
      'Narrativa não apropriada para gênero',
    ],
    suggestedFixes: [
      'Ajustar spec para melhor alinhamento com gênero',
      'Oferecer sugestões baseadas em gênero',
      'Permitir que usuário mude gênero se desejado',
    ],
    httpStatus: 400,
  },
  
  // Erros de geração (GEN_xxx)
  GEN_001: {
    code: 'GEN_001',
    category: 'generation',
    severity: 'error',
    message: 'Falha ao gerar código',
    description: 'O gerador de código falhou ao processar a spec',
    possibleCauses: [
      'Spec muito complexa para gerador atual',
      'Componente necessário não implementado',
      'Erro interno no gerador de código',
    ],
    suggestedFixes: [
      'Simplificar spec',
      'Implementar componente faltante',
      'Debuggar gerador de código',
    ],
    httpStatus: 500,
  },
  
  GEN_002: {
    code: 'GEN_002',
    category: 'generation',
    severity: 'error',
    message: 'Falha ao gerar assets',
    description: 'O gerador de assets falhou ao criar assets necessários',
    possibleCauses: [
      'API de geração de assets indisponível',
      'Limite de quota excedido',
      'Formato de asset não suportado',
    ],
    suggestedFixes: [
      'Usar assets placeholder',
      'Implementar fallback para geração local',
      'Solicitar ao usuário que forneça assets',
    ],
    httpStatus: 500,
  },
  
  GEN_003: {
    code: 'GEN_003',
    category: 'generation',
    severity: 'warning',
    message: 'Geração parcial bem-sucedida',
    description: 'Alguns componentes foram gerados, outros falharam',
    possibleCauses: [
      'Alguns componentes não suportam certas features',
      'Recursos insuficientes para geração completa',
      'Timeout em componentes específicos',
    ],
    suggestedFixes: [
      'Usar implementações simplificadas para componentes problemáticos',
      'Priorizar componentes críticos',
      'Oferecer opção de geração incremental',
    ],
    httpStatus: 206,
  },
  
  // Erros de runtime (RTE_xxx)
  RTE_001: {
    code: 'RTE_001',
    category: 'runtime',
    severity: 'fatal',
    message: 'Jogo não inicializa',
    description: 'O jogo gerado falha ao inicializar',
    possibleCauses: [
      'Dependências faltando',
      'Erro de sintaxe no código gerado',
      'Configuração incompatível',
    ],
    suggestedFixes: [
      'Verificar e instalar dependências',
      'Corrigir código gerado',
      'Ajustar configuração de runtime',
    ],
    httpStatus: 500,
  },
  
  RTE_002: {
    code: 'RTE_002',
    category: 'runtime',
    severity: 'error',
    message: 'Crash durante execução',
    description: 'Jogo crasha durante execução',
    possibleCauses: [
      'Memory leak',
      'Access violation',
      'Unhandled exception',
    ],
    suggestedFixes: [
      'Adicionar error boundaries',
      'Melhorar tratamento de exceções',
      'Otimizar uso de memória',
    ],
    httpStatus: 500,
  },
  
  RTE_003: {
    code: 'RTE_003',
    category: 'runtime',
    severity: 'warning',
    message: 'Performance abaixo do esperado',
    description: 'Jogo roda com performance insuficiente',
    possibleCauses: [
      'Código não otimizado',
      'Assets muito pesados',
      'Configuração de performance inadequada',
    ],
    suggestedFixes: [
      'Otimizar código crítico',
      'Compressão de assets',
      'Ajustar configurações de performance',
    ],
  },
  
  // Erros de rede (NET_xxx)
  NET_001: {
    code: 'NET_001',
    category: 'network',
    severity: 'error',
    message: 'Falha de conexão',
    description: 'Não foi possível conectar aos serviços necessários',
    possibleCauses: [
      'Serviço offline',
      'Problemas de rede',
      'Firewall bloqueando conexão',
    ],
    suggestedFixes: [
      'Verificar status do serviço',
      'Verificar conexão de rede',
      'Configurar exceções de firewall',
    ],
    httpStatus: 503,
  },
  
  NET_002: {
    code: 'NET_002',
    category: 'network',
    severity: 'error',
    message: 'Timeout na requisição',
    description: 'Requisição excedeu tempo limite',
    possibleCauses: [
      'Serviço lento',
      'Payload muito grande',
      'Problemas de latência',
    ],
    suggestedFixes: [
      'Aumentar timeout',
      'Otimizar payload',
      'Implementar retry com backoff',
    ],
    httpStatus: 504,
  },
  
  NET_003: {
    code: 'NET_003',
    category: 'network',
    severity: 'error',
    message: 'Quota excedida',
    description: 'Limite de uso do serviço excedido',
    possibleCauses: [
      'Muitas requisições',
      'Uso excessivo de recursos',
      'Plano limitado',
    ],
    suggestedFixes: [
      'Aguardar reset de quota',
      'Otimizar uso de recursos',
      'Upgrade de plano',
    ],
    httpStatus: 429,
  },
  
  // Erros de sistema (SYS_xxx)
  SYS_001: {
    code: 'SYS_001',
    category: 'system',
    severity: 'fatal',
    message: 'Memória insuficiente',
    description: 'Sistema sem memória suficiente para operação',
    possibleCauses: [
      'Memory leak',
      'Processo usando muita memória',
      'Sistema com pouca RAM',
    ],
    suggestedFixes: [
      'Otimizar uso de memória',
      'Reiniciar processo',
      'Aumentar recursos do sistema',
    ],
    httpStatus: 500,
  },
  
  SYS_002: {
    code: 'SYS_002',
    category: 'system',
    severity: 'fatal',
    message: 'Disco cheio',
    description: 'Sem espaço em disco para operação',
    possibleCauses: [
      'Muitos arquivos temporários',
      'Assets muito grandes',
      'Disco com capacidade insuficiente',
    ],
    suggestedFixes: [
      'Limpar arquivos temporários',
      'Comprimir assets',
      'Aumentar capacidade de disco',
    ],
    httpStatus: 500,
  },
  
  SYS_003: {
    code: 'SYS_003',
    category: 'system',
    severity: 'error',
    message: 'Permissão negada',
    description: 'Sem permissão para acessar recurso necessário',
    possibleCauses: [
      'Usuário sem privilégios',
      'Arquivo protegido',
      'Restrição de segurança',
    ],
    suggestedFixes: [
      'Executar com privilégios adequados',
      'Ajustar permissões de arquivo',
      'Configurar políticas de segurança',
    ],
    httpStatus: 403,
  },
};

// Mapeamento de HTTP status para códigos de erro
export const HTTP_STATUS_TO_ERROR: Record<number, string[]> = {
  400: ['VAL_001', 'VAL_002', 'VAL_003', 'VAL_004'],
  403: ['SYS_003'],
  404: [], // Não temos erros 404 específicos ainda
  429: ['NET_003'],
  500: ['GEN_001', 'GEN_002', 'RTE_001', 'RTE_002', 'SYS_001', 'SYS_002'],
  503: ['NET_001'],
  504: ['NET_002'],
};

// Configurações de tratamento de erro
export const ERROR_HANDLING_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_FACTOR: 2,
  LOG_ERRORS: true,
  SEND_TO_TELEMETRY: true,
  USER_FRIENDLY_MESSAGES: true,
  SUPPRESS_TECHNICAL_DETAILS_IN_PROD: true,
} as const;

// Funções utilitárias
export function getErrorByCode(code: string): ErrorCode | null {
  return COMPILER_ERRORS[code] || null;
}

export function getErrorsByCategory(category: ErrorCode['category']): ErrorCode[] {
  return Object.values(COMPILER_ERRORS).filter(error => error.category === category);
}

export function getErrorsBySeverity(severity: ErrorCode['severity']): ErrorCode[] {
  return Object.values(COMPILER_ERRORS).filter(error => error.severity === severity);
}

export function createErrorContext(
  phase: string,
  component: string,
  spec?: unknown,
  data?: unknown
): ErrorContext {
  return {
    phase,
    component,
    spec,
    data,
    timestamp: Date.now(),
  };
}

export function formatErrorMessage(
  errorCode: string,
  context?: ErrorContext,
  includeTechnical: boolean = false
): string {
  const error = getErrorByCode(errorCode);
  if (!error) {
    return `Erro desconhecido: ${errorCode}`;
  }
  
  let message = error.message;
  
  if (includeTechnical && context) {
    message += ` [Phase: ${context.phase}, Component: ${context.component}]`;
  }
  
  return message;
}

export function shouldRetryError(errorCode: string, retryCount: number): boolean {
  const error = getErrorByCode(errorCode);
  if (!error) return false;
  
  // Não retentar erros fatais
  if (error.severity === 'fatal') return false;
  
  // Limite de retentativas
  if (retryCount >= ERROR_HANDLING_CONFIG.MAX_RETRIES) return false;
  
  // Retentar apenas certas categorias
  const retryCategories: ErrorCode['category'][] = ['network', 'system'];
  return retryCategories.includes(error.category);
}

export function calculateRetryDelay(retryCount: number): number {
  const baseDelay = ERROR_HANDLING_CONFIG.RETRY_DELAY_MS;
  const backoffFactor = ERROR_HANDLING_CONFIG.RETRY_BACKOFF_FACTOR;
  return baseDelay * Math.pow(backoffFactor, retryCount);
}

export function getSuggestedFixes(errorCode: string): string[] {
  const error = getErrorByCode(errorCode);
  return error?.suggestedFixes || [];
}

export function isUserRecoverable(errorCode: string): boolean {
  const error = getErrorByCode(errorCode);
  if (!error) return false;
  
  // Erros de validação são geralmente recuperáveis pelo usuário
  if (error.category === 'validation') return true;
  
  // Warnings e infos são recuperáveis
  if (error.severity === 'warning' || error.severity === 'info') return true;
  
  return false;
}

// Validação
export function validateErrorCode(code: unknown): ErrorCode {
  return ErrorCodeSchema.parse(code);
}

export function validateErrorCodeSafe(code: unknown): ErrorCode | null {
  try {
    return ErrorCodeSchema.parse(code);
  } catch {
    return null;
  }
}

export function validateErrorContext(context: unknown): ErrorContext {
  return ErrorContextSchema.parse(context);
}

export function validateErrorContextSafe(context: unknown): ErrorContext | null {
  try {
    return ErrorContextSchema.parse(context);
  } catch {
    return null;
  }
}