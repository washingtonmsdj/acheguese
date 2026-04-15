/**
 * Reserved Slugs
 * Lista de slugs reservados que não podem ser usados como identificadores públicos
 */

export const RESERVED_SLUGS = [
  'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
  'profile', 'perfil', 'settings', 'configuracoes',
  'business', 'businesss', 'empresas', 'services', 'servicos',
  'professionals', 'profissionais', 'classifieds', 'classificados',
  'events', 'eventos', 'community', 'comunidade',
  'mobility', 'mobilidade', 'messages', 'mensagens',
  'jobs', 'vagas', 'pontos-turisticos',
  'search', 'busca', 'map', 'mapa', 'about', 'sobre',
  'contact', 'contato', 'help', 'ajuda', 'terms', 'termos',
  'static', 'assets', 'public', 'uploads', 'files',
  'u', 'p', 'user', 'users', 'usuario', 'usuarios',
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
