import type {
  [Nome],
  [Nome]Filters,
  Create[Nome]Input,
  Update[Nome]Input,
} from "../types/[nome].types";

/**
 * Boundary de persistência de [domínio].
 *
 * A implementação concreta pertence ao owner de core. O módulo não deve
 * conhecer Supabase, tabela, RPC ou outro adapter de infraestrutura.
 */
export interface [Nome]Repository {
  list(filters?: [Nome]Filters): Promise<[Nome][]>;
  getById(id: string): Promise<[Nome] | null>;
  create(input: Create[Nome]Input): Promise<[Nome]>;
  update(id: string, input: Update[Nome]Input): Promise<[Nome]>;
  delete(id: string): Promise<void>;
}
