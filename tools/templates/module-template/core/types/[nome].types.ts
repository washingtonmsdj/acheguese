/**
 * Contratos canônicos de [domínio].
 * Owner: src/core/[nome]
 */

export const [Nome]Status = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

export type [Nome]Status = (typeof [Nome]Status)[keyof typeof [Nome]Status];

export interface [Nome] {
  id: string;
  status: [Nome]Status;
  created_at: string;
  updated_at: string;
}

export interface [Nome]Filters {
  status?: [Nome]Status;
  limit?: number;
  cursor?: string | null;
}

export interface Create[Nome]Input {
  status?: [Nome]Status;
}

export interface Update[Nome]Input {
  status?: [Nome]Status;
}
