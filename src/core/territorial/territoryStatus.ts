/**
 * territoryStatus — Contrato de status de território na home
 *
 * Define o estado de disponibilidade de um território para exibição pública.
 *
 * available  — território ativo, com conteúdo real, acessível agora
 * expanding  — território em processo de ativação, aceita cadastros
 * soon       — território planejado, ainda não operacional
 */

export type TerritoryStatus = 'available' | 'expanding' | 'soon';

export interface TerritoryCard {
  id: string;
  name: string;
  description: string;
  status: TerritoryStatus;
  /** URL da landing — null se status !== 'available' */
  url: string | null;
  /** Bairros que compõem o território (para grupos) */
  members?: string[];
}

export const TERRITORY_STATUS_LABEL: Record<TerritoryStatus, string> = {
  available: 'Disponível',
  expanding: 'Em expansão',
  soon:      'Em breve',
};

export const TERRITORY_STATUS_STYLE: Record<TerritoryStatus, string> = {
  available: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  expanding: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  soon:      'bg-white/8 text-white/40 border-white/15',
};
