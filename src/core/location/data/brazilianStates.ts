/**
 * Lista estÃ¡tica dos estados brasileiros.
 * Usado pelo TerritoryModeSelector para navegaÃ§Ã£o UF â†’ Cidade.
 */

export interface BrazilianState {
  code: string;    // sigla UF lowercase (ba, sp, rj...)
  name: string;    // nome completo
  region: string;  // regiÃ£o (Norte, Nordeste, etc.)
}

export const BRAZILIAN_STATES: BrazilianState[] = [
  // Norte
  { code: 'ac', name: 'Acre', region: 'Norte' },
  { code: 'ap', name: 'AmapÃ¡', region: 'Norte' },
  { code: 'am', name: 'Amazonas', region: 'Norte' },
  { code: 'pa', name: 'ParÃ¡', region: 'Norte' },
  { code: 'ro', name: 'RondÃ´nia', region: 'Norte' },
  { code: 'rr', name: 'Roraima', region: 'Norte' },
  { code: 'to', name: 'Tocantins', region: 'Norte' },
  // Nordeste
  { code: 'al', name: 'Alagoas', region: 'Nordeste' },
  { code: 'ba', name: 'Bahia', region: 'Nordeste' },
  { code: 'ce', name: 'CearÃ¡', region: 'Nordeste' },
  { code: 'ma', name: 'MaranhÃ£o', region: 'Nordeste' },
  { code: 'pb', name: 'ParaÃ­ba', region: 'Nordeste' },
  { code: 'pe', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'pi', name: 'PiauÃ­', region: 'Nordeste' },
  { code: 'rn', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'se', name: 'Sergipe', region: 'Nordeste' },
  // Centro-Oeste
  { code: 'df', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'go', name: 'GoiÃ¡s', region: 'Centro-Oeste' },
  { code: 'mt', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'ms', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  // Sudeste
  { code: 'es', name: 'EspÃ­rito Santo', region: 'Sudeste' },
  { code: 'mg', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'rj', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'sp', name: 'SÃ£o Paulo', region: 'Sudeste' },
  // Sul
  { code: 'pr', name: 'ParanÃ¡', region: 'Sul' },
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

/**
 * Bairros de Salvador â€” SSOT territorial (cidade de lanÃ§amento)
 * Fonte Ãºnica para qualquer componente que precise listar bairros de Salvador.
 */
export const SALVADOR_NEIGHBORHOODS = [
  'Amaralina', 'Barra', 'Barris', 'Boa Viagem', 'Boca do Rio',
  'Brotas', 'Cabula', 'Cajazeiras', 'Caminho das Ãrvores', 'Campo Grande',
  'Canela', 'Castelo Branco', 'Centro', 'Cidade Nova', 'Cosme de Farias',
  'Costa Azul', 'FederaÃ§Ã£o', 'Garcia', 'GraÃ§a', 'ImbuÃ­',
  'Itaigara', 'ItapuÃ£', 'Liberdade', 'Matatu', 'Mussurunga',
  'Narandiba', 'Nordeste de Amaralina', 'Ondina', 'Paralela', 'Paripe',
  'PernambuÃ©s', 'PiatÃ£', 'Pituba', 'Plataforma', 'Ribeira',
  'Rio Vermelho', 'Roma', 'Santa Cruz', 'Santo AntÃ´nio', 'SÃ£o Marcos',
  'STIEP', 'Stella Maris', 'Sussuarana', 'Tancredo Neves',
  'Trobogy', 'Uruguai', 'Vale das Pedrinhas', 'ValÃ©ria', 'VitÃ³ria',
] as const;
