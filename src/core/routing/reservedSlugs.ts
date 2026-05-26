/**
 * Reserved Slugs
 * Lista de slugs reservados que não podem ser usados como identificadores públicos
 */

import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";

export const RESERVED_SLUGS = [
  'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
  'profile', 'perfil', 'settings', 'configuracoes',
  'business', APP_MODULE_SLUGS.business, 'services', APP_MODULE_SLUGS.services,
  'professionals', 'profissionais', 'classifieds', APP_MODULE_SLUGS.classifieds,
  'events', APP_MODULE_SLUGS.events, 'community', APP_MODULE_SLUGS.community,
  'mobility', APP_MODULE_SLUGS.mobility, 'messages', 'mensagens',
  'jobs', APP_MODULE_SLUGS.jobs, APP_MODULE_SLUGS.touristPoints,
  'search', APP_MODULE_SLUGS.search, 'map', APP_MODULE_SLUGS.map, 'about', 'sobre',
  'contact', 'contato', 'help', 'ajuda', 'terms', 'termos',
  'static', 'assets', 'public', 'uploads', 'files',
  'u', 'p', 'user', 'users', 'usuario', 'usuarios',
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
