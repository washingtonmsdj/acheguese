/**
 * Utilitarios de URL para slugs de dominio.
 *
 * Mantido em shared sem dependencias de core.
 */

import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";

export const RESERVED_SLUGS = [
  "admin",
  "api",
  "auth",
  "login",
  "logout",
  "signup",
  "register",
  "profile",
  "perfil",
  "settings",
  "configuracoes",
  "business",
  APP_MODULE_SLUGS.business,
  "services",
  APP_MODULE_SLUGS.services,
  "professionals",
  "profissionais",
  "classifieds",
  APP_MODULE_SLUGS.classifieds,
  "events",
  APP_MODULE_SLUGS.events,
  "community",
  APP_MODULE_SLUGS.community,
  "mobility",
  APP_MODULE_SLUGS.mobility,
  "messages",
  "mensagens",
  "jobs",
  APP_MODULE_SLUGS.jobs,
  APP_MODULE_SLUGS.touristPoints,
  "search",
  APP_MODULE_SLUGS.search,
  "map",
  APP_MODULE_SLUGS.map,
  "about",
  "sobre",
  "contact",
  "contato",
  "help",
  "ajuda",
  "terms",
  "termos",
  "static",
  "assets",
  "public",
  "uploads",
  "files",
  "u",
  "p",
  "user",
  "users",
  "usuario",
  "usuarios",
] as const;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(
    slug.toLowerCase() as (typeof RESERVED_SLUGS)[number],
  );
}

function removeAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function gerarSlug(texto: string): string {
  return removeAcentos(texto)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSlugValido(slug: string): boolean {
  return !isReservedSlug(slug.toLowerCase());
}

export function gerarSlugUnico(
  texto: string,
  slugsExistentes: string[],
): string {
  let slug = gerarSlug(texto);

  if (!isSlugValido(slug)) {
    slug = `${slug}-business`;
  }

  if (!slugsExistentes.includes(slug)) {
    return slug;
  }

  let contador = 1;
  let slugComSufixo = `${slug}-${contador}`;

  while (slugsExistentes.includes(slugComSufixo)) {
    contador++;
    slugComSufixo = `${slug}-${contador}`;
  }

  return slugComSufixo;
}

export function normalizarParaUrl(texto: string): string {
  return gerarSlug(texto);
}
