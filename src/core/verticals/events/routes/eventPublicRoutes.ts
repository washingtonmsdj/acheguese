import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";

export const EVENT_PUBLIC_ROUTE_SEGMENTS = {
  calendar: TERRITORIAL_ROUTE_STATIC_SEGMENTS.calendar,
  detail: TERRITORIAL_ROUTE_STATIC_SEGMENTS.eventDetail,
  favorites: TERRITORIAL_ROUTE_STATIC_SEGMENTS.favorites,
  map: TERRITORIAL_ROUTE_STATIC_SEGMENTS.map,
} as const;

export const EVENT_PUBLIC_ROUTE_PARAMS = {
  eventId: TERRITORIAL_ROUTE_PARAMS.eventId,
} as const;

function cleanRouteSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, "");
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }
  return segment;
}

function cleanRouteBase(value: string): string {
  const base = value.trim().replace(/\/+$/g, "");
  if (!base.startsWith("/") || /[?#]/.test(base)) {
    throw new Error("base de rota de eventos invalida.");
  }
  return base === "" ? eventPublicRoutes.home() : base;
}

function appendToBase(base: string, suffixSegments: readonly string[]): string {
  const suffix = suffixSegments
    .map((segment) => cleanRouteSegment(segment, "segmento da rota de eventos"))
    .join("/");
  return `${cleanRouteBase(base)}/${suffix}`;
}

function buildDetailSuffix(eventId: string): string {
  return `${EVENT_PUBLIC_ROUTE_SEGMENTS.detail}/${cleanRouteSegment(eventId, "id do evento")}`;
}

export const eventPublicRoutes = {
  home: () => buildAppModulePath(APP_MODULE_SLUGS.events),
  favorites: () =>
    buildAppModulePath(APP_MODULE_SLUGS.events, EVENT_PUBLIC_ROUTE_SEGMENTS.favorites),
  calendar: () =>
    buildAppModulePath(APP_MODULE_SLUGS.events, EVENT_PUBLIC_ROUTE_SEGMENTS.calendar),
  map: () => buildAppModulePath(APP_MODULE_SLUGS.events, EVENT_PUBLIC_ROUTE_SEGMENTS.map),
  detail: (eventId: string) =>
    buildAppModulePath(APP_MODULE_SLUGS.events, buildDetailSuffix(eventId)),
  legacyDetail: (eventId: string) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.events,
      cleanRouteSegment(eventId, "id do evento"),
    ),
  favoritesFromBase: (base: string) => appendToBase(base, [EVENT_PUBLIC_ROUTE_SEGMENTS.favorites]),
  calendarFromBase: (base: string) => appendToBase(base, [EVENT_PUBLIC_ROUTE_SEGMENTS.calendar]),
  mapFromBase: (base: string) => appendToBase(base, [EVENT_PUBLIC_ROUTE_SEGMENTS.map]),
  detailFromBase: (base: string, eventId: string) =>
    appendToBase(base, [
      EVENT_PUBLIC_ROUTE_SEGMENTS.detail,
      cleanRouteSegment(eventId, "id do evento"),
    ]),
} as const;

export const eventTerritorialRoutePaths = {
  home: () => buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events),
  district: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
      TERRITORIAL_ROUTE_PARAMS.district,
    ]),
  favorites: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
      EVENT_PUBLIC_ROUTE_SEGMENTS.favorites,
    ]),
  calendar: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
      EVENT_PUBLIC_ROUTE_SEGMENTS.calendar,
    ]),
  map: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
      EVENT_PUBLIC_ROUTE_SEGMENTS.map,
    ]),
  detail: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
      EVENT_PUBLIC_ROUTE_SEGMENTS.detail,
      EVENT_PUBLIC_ROUTE_PARAMS.eventId,
    ]),
} as const;
