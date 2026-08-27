/**
 * ============================================
 * [NOME] TYPES (SSOT)
 * ============================================
 * Tipos centralizados para todo o sistema
 * Única fonte de verdade para tipos de [domínio]
 */

// ============================================
// ENUMS
// ============================================

export const [Nome]Type = {
  TYPE_1: 'type_1',
  TYPE_2: 'type_2',
  TYPE_3: 'type_3',
} as const;

export type [Nome]Type = typeof [Nome]Type[keyof typeof [Nome]Type];

export const [Nome]Status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

export type [Nome]Status = typeof [Nome]Status[keyof typeof [Nome]Status];

// ============================================
// INTERFACES
// ============================================

/**
 * Interface principal do [domínio]
 */
export interface [Nome] {
  id: string;
  user_id: string;
  type: [Nome]Type;
  status: [Nome]Status;
  created_at: string;
  updated_at: string;
}

/**
 * Filtros para busca de [itens]
 */
export interface [Nome]Filters {
  type?: [Nome]Type;
  status?: [Nome]Status;
  limit?: number;
  offset?: number;
}

/**
 * Parâmetros para criar [item]
 */
export interface Create[Nome]Params {
  user_id: string;
  type: [Nome]Type;
  status?: [Nome]Status;
}

/**
 * Parâmetros para atualizar [item]
 */
export interface Update[Nome]Params {
  type?: [Nome]Type;
  status?: [Nome]Status;
}

/**
 * Estatísticas de [itens]
 */
export interface [Nome]Stats {
  total: number;
  by_type: Partial<Record<[Nome]Type, number>>;
  by_status: Partial<Record<[Nome]Status, number>>;
}
