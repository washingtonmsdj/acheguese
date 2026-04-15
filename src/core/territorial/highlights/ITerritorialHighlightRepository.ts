import type { TerritorialHighlight, CreateHighlightInput, HighlightQuery } from './types';

export interface ITerritorialHighlightRepository {
  /**
   * Lista destaques válidos para um território.
   * Por padrão retorna apenas ativos e dentro da validade (starts_at/ends_at).
   * Ordenados por position ASC, starts_at DESC.
   */
  listForTerritory(query: HighlightQuery): Promise<TerritorialHighlight[]>;

  findById(id: string): Promise<TerritorialHighlight | null>;

  create(input: CreateHighlightInput): Promise<TerritorialHighlight>;

  update(id: string, input: Partial<CreateHighlightInput>): Promise<TerritorialHighlight>;

  delete(id: string): Promise<void>;
}
