import type React from "react";
import {
  BadgeCheck,
  CircleHelp,
  Megaphone,
  MessageCircle,
  Tag,
} from "lucide-react";

import bairroChapada from "@/assets/bairro-chapada.jpg";
import bairroNordeste from "@/assets/bairro-nordeste.jpg";
import bairroOndina from "@/assets/bairro-ondina.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";
import bairroSantaCruz from "@/assets/bairro-santa-cruz.jpg";
import bairroStiep from "@/assets/bairro-stiep.jpg";
import bairroValePedrinhas from "@/assets/bairro-vale-pedrinhas.jpg";
import heroSalvador from "@/assets/hero-cidade-salvador-real.jpg";
import neighborhoodFeatured from "@/assets/neighborhood-featured.jpg";

import type { FeaturedBusiness } from "@/core/landing/services/LandingFeaturedService";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import { getRecordValue } from "@/shared/utils/recordLookup";

import type { CommunityOverviewView } from "@/core/community-feed/navigation";

export const COMMUNITY_HERO_IMAGES: Record<string, string> = {
  barra: bairroOndina,
  chapada: bairroChapada,
  "complexo-do-nordeste-de-amaralina": bairroNordeste,
  nordeste: bairroNordeste,
  ondina: bairroOndina,
  pituba: bairroPituba,
  "rio-vermelho": bairroRioVermelho,
  "santa-cruz": bairroSantaCruz,
  stiep: bairroStiep,
  "vale-das-pedrinhas": bairroValePedrinhas,
};

export function formatSlugLabel(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function getResolvedSlug(resolved?: ResolvedTerritory): string | null {
  if (resolved?.kind === "group") return resolved.group.slug;
  if (resolved?.kind === "location") return resolved.location.slug;
  return null;
}

export function getHeroImage(resolved?: ResolvedTerritory): string {
  const slug = getResolvedSlug(resolved);
  const communityImage = slug
    ? getRecordValue(COMMUNITY_HERO_IMAGES, slug)
    : undefined;
  if (communityImage) return communityImage;
  if (resolved?.kind === "location" && resolved.location.type === "city")
    return heroSalvador;
  return neighborhoodFeatured;
}

export function buildCommunityViewHref(
  baseHref: string,
  view: CommunityOverviewView,
): string {
  if (view === "feed") return baseHref;
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}view=${encodeURIComponent(view)}`;
}

export function getTerritoryLocationLabel(resolved?: ResolvedTerritory): string {
  if (resolved?.kind === "group") return "Comunidade territorial";
  if (resolved?.kind === "location") {
    const stateCode =
      typeof resolved.location.metadata?.state_code === "string"
        ? resolved.location.metadata.state_code.toUpperCase()
        : null;
    const parent = stateCode ? `, ${stateCode}` : "";
    return `${resolved.location.name}${parent}`;
  }
  return "Comunidade local";
}

export function getCommunityLocationLine(resolved?: ResolvedTerritory): string {
  if (resolved?.kind === "group") return "Comunidade territorial";
  if (resolved?.kind !== "location") return "Comunidade local";

  const stateCode =
    typeof resolved.location.metadata?.state_code === "string"
      ? resolved.location.metadata.state_code.toUpperCase()
      : null;
  const pathParts = resolved.location.geographic_path
    .split("/")
    .filter(Boolean);
  const pathState = pathParts[1]?.toUpperCase() ?? null;
  const citySlug = pathParts[2] ?? null;
  const cityName =
    resolved.location.type === "city"
      ? resolved.location.name
      : citySlug
        ? formatSlugLabel(citySlug)
        : resolved.location.full_name || resolved.location.name;
  const state = stateCode ?? pathState;

  return state ? `${cityName}, ${state}` : cityName;
}

export function getCommunityTitle(
  territoryName: string,
  communityProfile?: TerritorialCommunityProfile | null,
): string {
  const profileName = communityProfile?.name?.trim();
  const normalizedProfileName = profileName?.replace(/^Achegue-se\s+/i, "");

  if (
    normalizedProfileName &&
    !/^a comunidade (da|de|do) .+ esta chegando$/i.test(normalizedProfileName)
  ) {
    return normalizedProfileName;
  }

  return territoryName;
}

export function getCommunityDescription(
  territoryName: string,
  communityProfile?: TerritorialCommunityProfile | null,
): string {
  const candidates = [
    communityProfile?.hero_subtitle?.trim(),
    communityProfile?.headline?.trim(),
    communityProfile?.description?.trim(),
  ].filter(Boolean) as string[];
  const publicDescription = candidates.find(
    (candidate) =>
      !/cadastre seu interesse|ser avisado|achegue-se .*est[aá] chegando|comunidade .*est[aá] chegando|^em breve\b/i.test(
        candidate,
      ),
  );

  return (
    publicDescription ||
    `Acompanhe empresas, classificados, gastronomia, serviços e conversas relevantes de ${territoryName}.`
  );
}

export function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  if (value >= 1000) {
    const formatted = new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: value >= 10000 ? 0 : 1,
    }).format(value / 1000);
    return `${formatted} mil`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPublicPostDate(value: string | null | undefined): string {
  if (!value) return "agora";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "agora";

  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

export function getEventDateParts(value: string): {
  day: string;
  month: string;
  time: string;
} {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "---", time: "Horario a confirmar" };
  }

  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase(),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

export function getPublicPostAuthor(post: unknown): string {
  if (!post || typeof post !== "object") return "Morador";
  const record = post as {
    author_name?: string | null;
    author?: { display_name?: string | null } | null;
    author_profile?: { name?: string | null } | null;
  };
  return (
    record.author_name?.trim() ||
    record.author_profile?.name?.trim() ||
    record.author?.display_name?.trim() ||
    "Morador"
  );
}

export function getPublicPostTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "alerta":
      return "Alerta";
    case "recomendacao":
      return "Recomendacao";
    case "enquete":
      return "Enquete";
    case "pergunta":
      return "Pergunta";
    case "aviso":
      return "Aviso";
    case "achados":
      return "Achados";
    case "desapego":
      return "Classificado";
    default:
      return "Discussao";
  }
}

export function getPublicPostTypeIcon(
  type: string | null | undefined,
): React.ElementType {
  switch (type) {
    case "alerta":
      return Megaphone;
    case "recomendacao":
      return BadgeCheck;
    case "pergunta":
      return CircleHelp;
    case "aviso":
      return Megaphone;
    case "desapego":
      return Tag;
    default:
      return MessageCircle;
  }
}

export function buildBusinessHref(
  business: FeaturedBusiness,
  canonicalUrl: (ctx: {
    id: string;
    slug: string;
    is_premium?: boolean;
    geographic_path: string;
  }) => string,
): string | null {
  if (!business.slug || !business.geographic_path) return null;

  try {
    return canonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
  } catch {
    return null;
  }
}

export function normalizeCategoryLabel(value?: string | null): string {
  if (!value) return "Local";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
