/**
 * Constantes de gêneros de jogo
 * 
 * Sistema 100% genérico: aceita QUALQUER string como gênero válido
 * Este arquivo mantém apenas mapeamentos para backward compatibility
 */

/**
 * Gêneros legados para backward compatibility
 * Sistema 100% genérico: qualquer string é aceita como gênero
 */
export const LEGACY_GENRES = {
  PLATFORMER: 'platformer',
  RACING: 'racing',
  SHOOTER: 'shooter',
  PUZZLE: 'puzzle',
  SPORTS: 'sports',
  TOPDOWN: 'topdown',
  UNKNOWN: 'unknown',
} as const;

/**
 * Nomes de exibição para gêneros legados
 * Para uso em UI apenas
 */
export const GENRE_DISPLAY_NAMES = {
  [LEGACY_GENRES.PLATFORMER]: 'Plataforma',
  [LEGACY_GENRES.RACING]: 'Corrida',
  [LEGACY_GENRES.SHOOTER]: 'Tiro',
  [LEGACY_GENRES.PUZZLE]: 'Quebra-cabeça',
  [LEGACY_GENRES.SPORTS]: 'Esportes',
  [LEGACY_GENRES.TOPDOWN]: 'Top-Down',
  [LEGACY_GENRES.UNKNOWN]: 'Desconhecido',
} as const;

/**
 * Descrições para gêneros legados
 * Para uso em UI apenas
 */
export const GENRE_DESCRIPTIONS = {
  [LEGACY_GENRES.PLATFORMER]: 'Jogos de plataforma com pulos e obstáculos',
  [LEGACY_GENRES.RACING]: 'Jogos de corrida com veículos e pistas',
  [LEGACY_GENRES.SHOOTER]: 'Jogos de tiro com armas e inimigos',
  [LEGACY_GENRES.PUZZLE]: 'Jogos de quebra-cabeça e lógica',
  [LEGACY_GENRES.SPORTS]: 'Jogos baseados em esportes reais',
  [LEGACY_GENRES.TOPDOWN]: 'Jogos com visão de cima para baixo',
  [LEGACY_GENRES.UNKNOWN]: 'Gênero não especificado',
} as const;

/**
 * Valida se um gênero é legado
 * Sistema 100% genérico: sempre retorna true para qualquer string
 */
export function isValidGenre(genre: string): boolean {
  // Sistema 100% genérico: qualquer string não vazia é válida
  return typeof genre === 'string' && genre.trim().length > 0;
}

/**
 * Obtém nome de exibição para um gênero
 * Retorna o próprio gênero se não for legado (sistema 100% genérico)
 */
export function getGenreDisplayName(genre: string): string {
  if (GENRE_DISPLAY_NAMES[genre as keyof typeof GENRE_DISPLAY_NAMES]) {
    return GENRE_DISPLAY_NAMES[genre as keyof typeof GENRE_DISPLAY_NAMES];
  }
  
  // Sistema 100% genérico: retorna o próprio gênero capitalizado
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

/**
 * Obtém descrição para um gênero
 * Retorna descrição padrão se não for legado
 */
export function getGenreDescription(genre: string): string {
  if (GENRE_DESCRIPTIONS[genre as keyof typeof GENRE_DESCRIPTIONS]) {
    return GENRE_DESCRIPTIONS[genre as keyof typeof GENRE_DESCRIPTIONS];
  }
  
  // Sistema 100% genérico: descrição padrão para gêneros customizados
  return `Jogo do gênero ${genre}`;
}

/**
 * Lista de gêneros legados (apenas para backward compatibility)
 * Sistema 100% genérico: não limita gêneros possíveis
 */
export const LEGACY_GENRE_LIST = Object.values(LEGACY_GENRES);

/**
 * Verifica se um gênero é legado
 */
export function isLegacyGenre(genre: string): boolean {
  return (LEGACY_GENRE_LIST as readonly string[]).includes(genre);
}