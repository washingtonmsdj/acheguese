/**
 * TerritorialHighlightService
 *
 * Camada de serviço para destaques editoriais territoriais.
 * Centraliza regras de negócio — componentes não decidem nada.
 *
 * Regras:
 *   - Apenas destaques ativos e dentro da validade são retornados por padrão
 *   - Ordenação por position ASC
 *   - Suporta bairro (location) e grupo (group)
 *   - Nunca lança para a UI — retorna [] em caso de erro
 *   - starts_at deve ser anterior a ends_at quando ambos presentes
 */

import { createTerritorialHighlightRepository } from './createTerritorialHighlightRepository';
import type {
  TerritorialHighlight,
  CreateHighlightInput,
  HighlightQuery,
  HighlightStatus,
} from './types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export class TerritorialHighlightService {
  private repo = createTerritorialHighlightRepository();

  // ── Leitura ────────────────────────────────────────────────────────────────

  /** Lista destaques válidos para um território resolvido (uso na landing). */
  async getHighlightsForResolved(
    resolved: ResolvedTerritory,
  ): Promise<TerritorialHighlight[]> {
    if (!resolved) return [];
    const query: HighlightQuery =
      resolved.kind === 'group'
        ? { territory_type: 'group',    territory_ref_id: resolved.group.id }
        : { territory_type: 'location', territory_ref_id: resolved.location.id };
    try {
      return await this.repo.listForTerritory(query);
    } catch {
      return [];
    }
  }

  /** Lista TODOS os destaques de um território (uso no admin — inclui inativos/expirados). */
  async listAllForTerritory(query: HighlightQuery): Promise<TerritorialHighlight[]> {
    try {
      return await this.repo.listForTerritory({ ...query, only_valid: false });
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<TerritorialHighlight | null> {
    return this.repo.findById(id);
  }

  // ── Escrita ────────────────────────────────────────────────────────────────

  /** Cria um novo destaque com validação de negócio. */
  async createHighlight(input: CreateHighlightInput): Promise<TerritorialHighlight> {
    this.validateInput(input);
    return this.repo.create(input);
  }

  /** Atualiza campos de um destaque existente. */
  async updateHighlight(
    id: string,
    input: Partial<CreateHighlightInput>,
  ): Promise<TerritorialHighlight> {
    if (input.starts_at !== undefined || input.ends_at !== undefined) {
      const existing = await this.repo.findById(id);
      if (existing) {
        const starts = input.starts_at ?? existing.starts_at;
        const ends   = input.ends_at   ?? existing.ends_at;
        this.validateDates(starts, ends);
      }
    }
    return this.repo.update(id, input);
  }

  /** Ativa ou desativa um destaque. */
  async setHighlightStatus(id: string, status: HighlightStatus): Promise<TerritorialHighlight> {
    return this.repo.update(id, { status });
  }

  /** Remove permanentemente um destaque. */
  async deleteHighlight(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  /**
   * Reordena destaques de um território.
   * Recebe array de { id, position } e aplica em batch.
   * Não valida se os IDs pertencem ao território — responsabilidade do chamador.
   */
  async reorderHighlights(
    items: Array<{ id: string; position: number }>,
  ): Promise<void> {
    await Promise.all(
      items.map(({ id, position }) => this.repo.update(id, { position })),
    );
  }

  // ── Validação interna ──────────────────────────────────────────────────────

  private validateInput(input: CreateHighlightInput): void {
    if (!input.title?.trim()) throw new Error('Título é obrigatório');
    if (!input.territory_type)   throw new Error('Tipo de território é obrigatório');
    if (!input.territory_ref_id) throw new Error('Território é obrigatório');
    if (!input.highlight_type)   throw new Error('Tipo de destaque é obrigatório');
    this.validateDates(input.starts_at, input.ends_at);
    // CTA: se um dos dois existe, o outro deve existir
    if ((input.cta_label && !input.cta_url) || (!input.cta_label && input.cta_url)) {
      throw new Error('CTA requer label e URL juntos');
    }
  }

  private validateDates(starts?: string | null, ends?: string | null): void {
    if (starts && ends && new Date(starts) >= new Date(ends)) {
      throw new Error('Data de início deve ser anterior à data de fim');
    }
  }
}

export const territorialHighlightService = new TerritorialHighlightService();
