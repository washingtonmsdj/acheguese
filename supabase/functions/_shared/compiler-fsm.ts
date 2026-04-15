/**
 * Compiler FSM (Finite State Machine)
 * 
 * Define as transições válidas entre fases do compilador Ordax.
 * Este é o contrato SAGRADO que garante a integridade do fluxo de compilação.
 * 
 * REGRAS (validadas automaticamente):
 * 1. Transições são unidirecionais (não pode voltar) ✓
 * 2. Cada fase só pode avançar para fases específicas ✓
 * 3. Violações de transição são ERROS CRÍTICOS ✓
 * 4. IA NÃO decide fase, apenas preenche formato ✓
 */

export const ALLOWED_TRANSITIONS = {
  interpretation: ["plan"],
  plan: ["validation"],
  validation: ["confirmation"],
  confirmation: ["compilation"],
  compilation: [], // Estado final
} as const;

export type CompilerPhase = keyof typeof ALLOWED_TRANSITIONS;

// Códigos de erro únicos para FSM
export const FSM_ERROR_CODES = {
  INVALID_TARGET_PHASE: "FSM_001",
  INVALID_SOURCE_PHASE: "FSM_002",
  INVALID_TRANSITION: "FSM_003",
  INTEGRITY_VIOLATION: "FSM_004",
} as const;

/**
 * Gera lookup table de distâncias automaticamente a partir de ALLOWED_TRANSITIONS
 */
function generatePhaseDistances(): Record<CompilerPhase, Record<CompilerPhase, number>> {
  const phases = Object.keys(ALLOWED_TRANSITIONS) as CompilerPhase[];
  const distances: Record<string, number> = {};
  
  for (const from of phases) {
    distances[from] = {};
    for (const to of phases) {
      if (from === to) {
        distances[from][to] = 0;
      } else {
        // BFS para encontrar distância
        const dist = bfsDistance(from, to);
        distances[from][to] = dist;
      }
    }
  }
  
  return distances;
}

/**
 * BFS para calcular distância entre fases
 */
function bfsDistance(from: CompilerPhase, to: CompilerPhase): number {
  if (from === to) return 0;
  
  const queue: Array<{ phase: CompilerPhase; distance: number }> = [{ phase: from, distance: 0 }];
  const visited = new Set<CompilerPhase>([from]);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const nextPhases = ALLOWED_TRANSITIONS[current.phase] as readonly CompilerPhase[];
    
    for (const next of nextPhases) {
      if (next === to) {
        return current.distance + 1;
      }
      
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ phase: next, distance: current.distance + 1 });
      }
    }
  }
  
  return -1; // Não há caminho
}

/**
 * Gera lookup table de caminhos automaticamente
 */
function generatePhasePaths(): Record<CompilerPhase, Record<CompilerPhase, CompilerPhase[] | null>> {
  const phases = Object.keys(ALLOWED_TRANSITIONS) as CompilerPhase[];
  const paths: Record<string, CompilerPhase[] | null> = {};
  
  for (const from of phases) {
    paths[from] = {};
    for (const to of phases) {
      paths[from][to] = bfsPath(from, to);
    }
  }
  
  return paths;
}

/**
 * BFS para encontrar caminho entre fases
 */
function bfsPath(from: CompilerPhase, to: CompilerPhase): CompilerPhase[] | null {
  if (from === to) return [from];
  
  const queue: Array<{ phase: CompilerPhase; path: CompilerPhase[] }> = [{ phase: from, path: [from] }];
  const visited = new Set<CompilerPhase>([from]);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const nextPhases = ALLOWED_TRANSITIONS[current.phase] as readonly CompilerPhase[];
    
    for (const next of nextPhases) {
      const newPath = [...current.path, next];
      
      if (next === to) {
        return newPath;
      }
      
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ phase: next, path: newPath });
      }
    }
  }
  
  return null; // Não há caminho
}

// Gerar lookup tables automaticamente
const PHASE_DISTANCES = generatePhaseDistances();
const PHASE_PATHS = generatePhasePaths();

/**
 * Valida integridade do FSM na inicialização
 */
function validateFSMIntegrity(): void {
  const phases = Object.keys(ALLOWED_TRANSITIONS) as CompilerPhase[];
  
  // Validar que todas as fases referenciadas existem
  for (const [from, transitions] of Object.entries(ALLOWED_TRANSITIONS)) {
    for (const to of transitions) {
      if (!phases.includes(to as CompilerPhase)) {
        throw new Error(`FSM Integrity Error: Phase '${from}' references non-existent phase '${to}'`);
      }
    }
  }
  
  // Validar que transições são unidirecionais (Regra 1)
  for (const from of phases) {
    const reachable = new Set<CompilerPhase>();
    const queue = [from];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const next = ALLOWED_TRANSITIONS[current] as readonly CompilerPhase[];
      
      for (const phase of next) {
        if (!reachable.has(phase)) {
          reachable.add(phase);
          queue.push(phase);
        }
      }
    }
    
    // Verificar se alguma fase alcançável pode voltar para 'from'
    for (const reachablePhase of reachable) {
      const canGoBack = bfsDistance(reachablePhase, from) !== -1;
      if (canGoBack) {
        throw new Error(`FSM Integrity Error: Cycle detected - can go from '${from}' to '${reachablePhase}' and back`);
      }
    }
  }
}

// Validar integridade na inicialização
validateFSMIntegrity();

export interface FSMViolationErrorData {
  error: "FSM_VIOLATION";
  code: string;
  message: string;
  from: CompilerPhase | string;
  to: string;
  allowedTransitions: readonly string[];
}

export class FSMViolationError extends Error {
  public readonly data: FSMViolationErrorData;
  public readonly code: string;
  
  constructor(data: FSMViolationErrorData) {
    super(data.message);
    this.name = "FSMViolationError";
    this.code = data.code;
    this.data = data;
    
    // Mantém stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FSMViolationError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      data: this.data
    };
  }
}

/**
 * Valida se uma transição de fase é permitida.
 * 
 * @throws FSMViolationError se transição for inválida
 */
export function assertTransition(from: CompilerPhase, to: string): asserts to is CompilerPhase {
  // Validar que 'from' é uma fase válida
  if (!isValidPhase(from)) {
    throw new FSMViolationError({
      error: "FSM_VIOLATION",
      code: FSM_ERROR_CODES.INVALID_SOURCE_PHASE,
      message: `Invalid source phase: '${from}' is not a valid compiler phase. Valid phases: ${getAllPhases().join(", ")}`,
      from,
      to,
      allowedTransitions: [],
    });
  }
  
  // Validar que 'to' é uma fase válida
  if (!isValidPhase(to)) {
    throw new FSMViolationError({
      error: "FSM_VIOLATION",
      code: FSM_ERROR_CODES.INVALID_TARGET_PHASE,
      message: `Invalid target phase: '${to}' is not a valid compiler phase. Valid phases: ${getAllPhases().join(", ")}`,
      from,
      to,
      allowedTransitions: ALLOWED_TRANSITIONS[from] as readonly string[],
    });
  }
  
  const allowed = ALLOWED_TRANSITIONS[from] as readonly string[];

  if (!allowed.includes(to)) {
    throw new FSMViolationError({
      error: "FSM_VIOLATION",
      code: FSM_ERROR_CODES.INVALID_TRANSITION,
      message: `Invalid phase transition: ${from} → ${to}. Valid transitions: ${allowed.join(", ")}`,
      from,
      to,
      allowedTransitions: allowed,
    });
  }
}

/**
 * Verifica se uma transição é válida sem lançar erro.
 * Usa assertTransition internamente para garantir consistência.
 * 
 * @example
 * canTransition("interpretation", "plan") // returns true
 * canTransition("interpretation", "compilation") // returns false
 * canTransition("plan", "interpretation") // returns false (cannot go back)
 * 
 * @returns true se transição é permitida
 */
export function canTransition(from: CompilerPhase, to: string): to is CompilerPhase {
  try {
    assertTransition(from, to);
    return true;
  } catch (error) {
    if (error instanceof FSMViolationError) {
      return false;
    }
    // Re-throw erros inesperados
    throw error;
  }
}

/**
 * Retorna as próximas fases válidas para uma fase atual.
 * 
 * @example
 * getValidNextPhases("interpretation") // returns ["plan"]
 * getValidNextPhases("compilation") // returns [] (final phase)
 * 
 * @returns Array de fases válidas para transição
 */
export function getValidNextPhases(from: CompilerPhase): readonly CompilerPhase[] {
  return ALLOWED_TRANSITIONS[from] as readonly CompilerPhase[];
}

/**
 * Verifica se uma fase é válida.
 * 
 * @example
 * isValidPhase("interpretation") // returns true
 * isValidPhase("plan") // returns true
 * isValidPhase("invalid_phase") // returns false
 * isValidPhase("") // returns false
 * 
 * @returns true se a fase existe no FSM
 */
export function isValidPhase(phase: string): phase is CompilerPhase {
  return phase in ALLOWED_TRANSITIONS;
}

/**
 * Retorna todas as fases válidas do compilador.
 * 
 * @example
 * getAllPhases() // returns ["interpretation", "plan", "validation", "confirmation", "compilation"]
 * 
 * @returns Array com todas as fases em ordem de execução
 */
export function getAllPhases(): CompilerPhase[] {
  return Object.keys(ALLOWED_TRANSITIONS) as CompilerPhase[];
}

/**
 * Verifica se uma fase é final (não tem transições).
 * 
 * @example
 * isFinalPhase("compilation") // returns true
 * isFinalPhase("interpretation") // returns false
 * isFinalPhase("plan") // returns false
 * 
 * @returns true se a fase não tem transições de saída
 */
export function isFinalPhase(phase: CompilerPhase): boolean {
  return ALLOWED_TRANSITIONS[phase].length === 0;
}

/**
 * Calcula a distância entre duas fases (número de transições).
 * Retorna -1 se não há caminho válido.
 * 
 * @example
 * getPhaseDistance("interpretation", "compilation") // returns 4
 * getPhaseDistance("plan", "interpretation") // returns -1 (cannot go back)
 */
export function getPhaseDistance(from: CompilerPhase, to: CompilerPhase): number {
  // Validar que ambas as fases existem
  if (!isValidPhase(from) || !isValidPhase(to)) {
    return -1;
  }
  
  // Validar que a entrada existe na lookup table
  if (!PHASE_DISTANCES[from] || PHASE_DISTANCES[from][to] === undefined) {
    return -1;
  }
  
  return PHASE_DISTANCES[from][to];
}

/**
 * Retorna o caminho completo entre duas fases.
 * Retorna null se não há caminho válido.
 * 
 * @example
 * getPhasePath("interpretation", "compilation") // returns ["interpretation", "plan", "validation", "confirmation", "compilation"]
 * getPhasePath("plan", "interpretation") // returns null
 */
export function getPhasePath(from: CompilerPhase, to: CompilerPhase): CompilerPhase[] | null {
  // Validar que ambas as fases existem
  if (!isValidPhase(from) || !isValidPhase(to)) {
    return null;
  }
  
  // Validar que a entrada existe na lookup table
  if (!PHASE_PATHS[from] || PHASE_PATHS[from][to] === undefined) {
    return null;
  }
  
  const path = PHASE_PATHS[from][to];
  
  // Garantir que retorna null em vez de undefined
  return path === undefined ? null : path;
}
