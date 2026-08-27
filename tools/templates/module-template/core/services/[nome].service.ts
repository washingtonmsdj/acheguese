import type { [Nome]Repository } from "../repositories/[nome].repository";
import type {
  [Nome],
  [Nome]Filters,
  Create[Nome]Input,
  Update[Nome]Input,
} from "../types/[nome].types";

/**
 * Regras e operações canônicas de [domínio].
 *
 * O service depende de uma boundary de repository, nunca de UI. A autorização
 * específica do domínio deve ser aplicada aqui ou na repository implementation
 * de forma consistente com RLS e contracts de identidade/profile.
 */
export class [Nome]Service {
  constructor(private readonly repository: [Nome]Repository) {}

  list(filters: [Nome]Filters = {}): Promise<[Nome][]> {
    return this.repository.list(filters);
  }

  getById(id: string): Promise<[Nome] | null> {
    return this.repository.getById(id);
  }

  create(input: Create[Nome]Input): Promise<[Nome]> {
    return this.repository.create(input);
  }

  update(id: string, input: Update[Nome]Input): Promise<[Nome]> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

export function create[Nome]Service(repository: [Nome]Repository): [Nome]Service {
  return new [Nome]Service(repository);
}
