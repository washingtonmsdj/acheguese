/**
 * TerritorialHighlightRepositoryMock
 *
 * Implementação in-memory com seed de exemplo para o Complexo do Nordeste.
 * Cobre todos os highlight_types para demonstração.
 */

import type { ITerritorialHighlightRepository } from './ITerritorialHighlightRepository';
import type { TerritorialHighlight, CreateHighlightInput, HighlightQuery } from './types';

const NOW = new Date().toISOString();
// Datas relativas ao momento atual para que o seed nunca expire em dev
const in30days = new Date(Date.now() + 30 * 86400_000).toISOString();
const in7days  = new Date(Date.now() +  7 * 86400_000).toISOString();

const SEED: TerritorialHighlight[] = [
  // ── Grupo: Complexo do Nordeste ──────────────────────────────────────────
  {
    id: 'hl-001',
    territory_type: 'group',
    territory_ref_id: 'tg-complexo-nordeste',
    highlight_type: 'notice',
    entity_id: null,
    title: 'Mutirão de limpeza no Complexo',
    subtitle: 'Sábado, 29 de março — 8h às 12h. Participe!',
    image_url: null,
    cta_label: 'Saiba mais',
    cta_url: null,
    position: 0,
    status: 'active',
    starts_at: NOW,
    ends_at: in7days,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'hl-002',
    territory_type: 'group',
    territory_ref_id: 'tg-complexo-nordeste',
    highlight_type: 'event',
    entity_id: null,
    title: 'Feira de Economia Solidária',
    subtitle: 'Produtos locais, artesanato e gastronomia do Complexo.',
    image_url: null,
    cta_label: 'Ver programação',
    cta_url: null,
    position: 1,
    status: 'active',
    starts_at: NOW,
    ends_at: in30days,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'hl-003',
    territory_type: 'group',
    territory_ref_id: 'tg-complexo-nordeste',
    highlight_type: 'creator',
    entity_id: null,
    title: 'Conheça o trabalho de Dona Zélia',
    subtitle: 'Artesã do Nordeste de Amaralina há 20 anos.',
    image_url: null,
    cta_label: 'Ver perfil',
    cta_url: null,
    position: 2,
    status: 'active',
    starts_at: NOW,
    ends_at: null,
    created_at: NOW,
    updated_at: NOW,
  },
  // ── Bairro: Nordeste de Amaralina ────────────────────────────────────────
  {
    id: 'hl-004',
    territory_type: 'location',
    territory_ref_id: 'loc-nordeste-de-amaralina',
    highlight_type: 'business',
    entity_id: null,
    title: 'Padaria do Seu Manoel',
    subtitle: 'Pão fresquinho todo dia desde 1998.',
    image_url: null,
    cta_label: 'Ver empresa',
    cta_url: null,
    position: 0,
    status: 'active',
    starts_at: NOW,
    ends_at: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'hl-005',
    territory_type: 'location',
    territory_ref_id: 'loc-nordeste-de-amaralina',
    highlight_type: 'notice',
    entity_id: null,
    title: 'Vacinação contra gripe — posto local',
    subtitle: 'Até sexta-feira, das 8h às 16h. Sem agendamento.',
    image_url: null,
    cta_label: null,
    cta_url: null,
    position: 1,
    status: 'active',
    starts_at: NOW,
    ends_at: in7days,
    created_at: NOW,
    updated_at: NOW,
  },
  // ── Inativo (não deve aparecer) ──────────────────────────────────────────
  {
    id: 'hl-006',
    territory_type: 'group',
    territory_ref_id: 'tg-complexo-nordeste',
    highlight_type: 'event',
    entity_id: null,
    title: 'Evento inativo — não deve aparecer',
    subtitle: null,
    image_url: null,
    cta_label: null,
    cta_url: null,
    position: 99,
    status: 'inactive',
    starts_at: NOW,
    ends_at: null,
    created_at: NOW,
    updated_at: NOW,
  },
  // ── Expirado (não deve aparecer) ─────────────────────────────────────────
  {
    id: 'hl-007',
    territory_type: 'group',
    territory_ref_id: 'tg-complexo-nordeste',
    highlight_type: 'notice',
    entity_id: null,
    title: 'Aviso expirado — não deve aparecer',
    subtitle: null,
    image_url: null,
    cta_label: null,
    cta_url: null,
    position: 99,
    status: 'active',
    starts_at: new Date(Date.now() - 10 * 86400_000).toISOString(),
    ends_at:   new Date(Date.now() -  1 * 86400_000).toISOString(), // ontem
    created_at: NOW,
    updated_at: NOW,
  },
];

function isValid(h: TerritorialHighlight): boolean {
  if (h.status !== 'active') return false;
  const now = Date.now();
  if (h.starts_at && new Date(h.starts_at).getTime() > now) return false;
  if (h.ends_at   && new Date(h.ends_at).getTime()   < now) return false;
  return true;
}

export class TerritorialHighlightRepositoryMock
  implements ITerritorialHighlightRepository
{
  private store: TerritorialHighlight[] = [...SEED];

  async listForTerritory(query: HighlightQuery): Promise<TerritorialHighlight[]> {
    const onlyValid = query.only_valid !== false; // default true
    return this.store
      .filter(
        (h) =>
          h.territory_type    === query.territory_type &&
          h.territory_ref_id  === query.territory_ref_id &&
          (!onlyValid || isValid(h)),
      )
      .sort((a, b) => a.position - b.position);
  }

  async findById(id: string): Promise<TerritorialHighlight | null> {
    return this.store.find((h) => h.id === id) ?? null;
  }

  async create(input: CreateHighlightInput): Promise<TerritorialHighlight> {
    const h: TerritorialHighlight = {
      id: crypto.randomUUID(),
      territory_type:   input.territory_type,
      territory_ref_id: input.territory_ref_id,
      highlight_type:   input.highlight_type,
      entity_id:        input.entity_id ?? null,
      title:            input.title,
      subtitle:         input.subtitle ?? null,
      image_url:        input.image_url ?? null,
      cta_label:        input.cta_label ?? null,
      cta_url:          input.cta_url ?? null,
      position:         input.position ?? 0,
      status:           input.status ?? 'active',
      starts_at:        input.starts_at ?? null,
      ends_at:          input.ends_at ?? null,
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    };
    this.store.push(h);
    return h;
  }

  async update(id: string, input: Partial<CreateHighlightInput>): Promise<TerritorialHighlight> {
    const idx = this.store.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error(`Highlight not found: ${id}`);
    this.store[idx] = { ...this.store[idx], ...input, updated_at: new Date().toISOString() };
    return this.store[idx];
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((h) => h.id !== id);
  }
}
