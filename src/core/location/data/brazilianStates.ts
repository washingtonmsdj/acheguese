/**
 * Lista estática dos estados brasileiros.
 * Usado pelo TerritoryModeSelector para navegação UF → Cidade.
 */

export interface BrazilianState {
  code: string;    // sigla UF lowercase (ba, sp, rj...)
  name: string;    // nome completo
  region: string;  // região (Norte, Nordeste, etc.)
}

export const BRAZILIAN_STATES: BrazilianState[] = [
  // Norte
  { code: 'ac', name: 'Acre', region: 'Norte' },
  { code: 'ap', name: 'Amapá', region: 'Norte' },
  { code: 'am', name: 'Amazonas', region: 'Norte' },
  { code: 'pa', name: 'Pará', region: 'Norte' },
  { code: 'ro', name: 'Rondônia', region: 'Norte' },
  { code: 'rr', name: 'Roraima', region: 'Norte' },
  { code: 'to', name: 'Tocantins', region: 'Norte' },
  // Nordeste
  { code: 'al', name: 'Alagoas', region: 'Nordeste' },
  { code: 'ba', name: 'Bahia', region: 'Nordeste' },
  { code: 'ce', name: 'Ceará', region: 'Nordeste' },
  { code: 'ma', name: 'Maranhão', region: 'Nordeste' },
  { code: 'pb', name: 'Paraíba', region: 'Nordeste' },
  { code: 'pe', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'pi', name: 'Piauí', region: 'Nordeste' },
  { code: 'rn', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'se', name: 'Sergipe', region: 'Nordeste' },
  // Centro-Oeste
  { code: 'df', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'go', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'mt', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'ms', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  // Sudeste
  { code: 'es', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'mg', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'rj', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'sp', name: 'São Paulo', region: 'Sudeste' },
  // Sul
  { code: 'pr', name: 'Paraná', region: 'Sul' },
  { code: 'rs', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'sc', name: 'Santa Catarina', region: 'Sul' },
];

export const BRAZILIAN_REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;

export function getStateByCode(code: string): BrazilianState | undefined {
  return BRAZILIAN_STATES.find(s => s.code === code.toLowerCase());
}

export function getStatesByRegion(region: string): BrazilianState[] {
  return BRAZILIAN_STATES.filter(s => s.region === region);
}
