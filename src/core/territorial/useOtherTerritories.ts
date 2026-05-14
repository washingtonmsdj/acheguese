/**
 * useOtherTerritories
 *
 * Retorna a lista de territórios secundários para o bloco "Outros locais" da home.
 * Exclui o território de lançamento principal (Complexo).
 *
 * Fonte atual: lista estática com status real.
 * Quando houver API de territórios com status, substituir aqui — sem mudar a home.
 *
 * Regra de exibição:
 *   - available  → clicável, vai para a landing
 *   - expanding  → clicável, vai para a landing (se existir) ou mostra badge
 *   - soon       → não clicável, apenas informativo
 */

import type { TerritoryCard } from './territoryStatus';

// Territórios conhecidos de Salvador além do Complexo.
// Status reflete a realidade operacional atual do produto.
// Atualizar aqui quando um novo território for ativado.
const OTHER_TERRITORIES: TerritoryCard[] = [
  {
    id: 'pituba',
    name: 'Pituba',
    description: 'Proxima comunidade: cadastre interesse e indique comercios locais.',
    status: 'expanding',
    url: '/comunidade/ba/salvador/pituba',
  },
  {
    id: 'rio-vermelho',
    name: 'Rio Vermelho',
    description: 'Cultura, gastronomia e vida noturna.',
    status: 'soon',
    url: null,
  },
  {
    id: 'amaralina',
    name: 'Amaralina',
    description: 'Praia, comércio e comunidade vibrante.',
    status: 'soon',
    url: null,
  },
  {
    id: 'itaigara',
    name: 'Itaigara',
    description: 'Residencial com serviços de qualidade.',
    status: 'soon',
    url: null,
  },
];

export function useOtherTerritories(): TerritoryCard[] {
  return OTHER_TERRITORIES;
}
