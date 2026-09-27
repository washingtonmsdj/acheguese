import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_FALLBACK_ACTION_LABEL,
  NOTIFICATION_INBOX_PATH,
  resolveNotificationActionTarget,
} from "../notificationActionScope";

describe("notification action lifecycle scope", () => {
  it.each([
    ["/ba/salvador/empresas", "business"],
    ["/central/empresas/business-1", "business"],
    ["/ba/salvador/mapa", "map"],
    ["/ba/salvador/perto-de-mim", "nearby"],
    ["/ba/salvador/busca?q=cafe", "search"],
    ["/mensagens/business/thread-1", "messaging"],
    ["/u/washington", "profiles"],
  ])("keeps active surface destination %s", (href, surface) => {
    expect(resolveNotificationActionTarget(href, "Abrir")).toEqual({
      href,
      label: "Abrir",
      isFallback: false,
      surface,
    });
  });

  it.each([
    ["/gastronomia/pedidos/order-1", "gastronomy"],
    ["/central/empresas/business-1/gastronomia/pedidos/order-1", "gastronomy"],
    ["/servicos/orcamentos/lead-1", "services"],
    ["/central/profissional", "services"],
    ["/mobilidade/buscando/ride-1", "mobility"],
    ["/central/motorista/corridas", "mobility"],
    ["/central/motoboy/entregas", "mobility"],
    ["/classificados/item-1", "classifieds"],
    ["/eventos/event-1", "events"],
    ["/planos", "billing"],
  ])("fails closed for paused surface destination %s", (href, surface) => {
    expect(resolveNotificationActionTarget(href, "Abrir")).toEqual({
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
      surface,
    });
  });

  it.each([
    "/notifications",
    "/settings/notifications",
    "/perfil/editar/profile-1",
    "/edit-business/business-1",
    "/empresas/ba/salvador",
    "/mapa/ba/salvador",
    "/perto-de-mim/ba/salvador",
    "/busca/ba/salvador",
    "/ba/salvador/comunidade/eventos/event-1",
    "/ba/salvador/comunidade/empresas",
  ])("fails closed for retired notification destination %s", (href) => {
    expect(resolveNotificationActionTarget(href, "Abrir")).toEqual({
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
    });
  });

  it("preserves external HTTPS destinations for SafeLink validation", () => {
    expect(
      resolveNotificationActionTarget("https://example.com/help", "Ajuda"),
    ).toEqual({
      href: "https://example.com/help",
      label: "Ajuda",
      isFallback: false,
    });
  });

  it("preserves horizontal account destinations that are not product-owned", () => {
    expect(resolveNotificationActionTarget("/conta/seguranca", "Segurança")).toEqual({
      href: "/conta/seguranca",
      label: "Segurança",
      isFallback: false,
      surface: undefined,
    });
  });

  it("requires both URL and label before exposing an action", () => {
    expect(resolveNotificationActionTarget("/mapa", undefined)).toBeNull();
    expect(resolveNotificationActionTarget(undefined, "Abrir")).toBeNull();
  });
});
