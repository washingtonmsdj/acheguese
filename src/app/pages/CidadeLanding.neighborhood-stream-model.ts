import {
  Map as MapIcon,
  MessageCircle,
  Store,
  Tag,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

import { classifiedUrlService } from "@/core/classifieds/services/ClassifiedUrlService";
import type { FeaturedBusiness, FeaturedClassified, FeaturedService } from "@/core/landing/services/LandingFeaturedService";
import type { Post } from "@/core/posts/types";
import { formatCategory, formatMetric, formatPrice } from "./CidadeLanding.constants";
import { formatRelativeTime, getBusinessPublicUrl, getTextPreview, withQueryParams } from "./CidadeLanding.utils";
import type {
  NeighborhoodCommunityTabId,
  NeighborhoodStreamGroups,
  NeighborhoodStreamItem,
  NeighborhoodStreamMoreConfig,
  NeighborhoodStreamTone,
} from "./CidadeLanding.neighborhood-stream";

type NeighborhoodStreamUrls = {
  feed: string;
  business: string;
  services: string;
  classifieds: string;
  gastronomy: string;
  map: string;
};

function getPostAuthorName(post: Post): string {
  const profile = (post as { author_profile?: { name?: string | null; username?: string | null } }).author_profile;
  return profile?.name?.trim() || profile?.username?.trim() || "Morador";
}

function getPostTypeLabel(type: string | undefined): { label: string; tone: NeighborhoodStreamTone } {
  switch (type) {
    case "alerta":
      return { label: "ALERTA DO BAIRRO", tone: "amber" };
    case "recomendacao":
      return { label: "SERVIÇO LOCAL", tone: "cyan" };
    case "evento":
      return { label: "EVENTO", tone: "green" };
    case "classificado":
    case "desapego":
      return { label: "CLASSIFICADO", tone: "amber" };
    default:
      return { label: "COMUNIDADE", tone: "cyan" };
  }
}

function buildFallbackItem({
  id,
  category,
  label,
  tone,
  title,
  description,
  href,
  mediaFallback,
  meta,
  engagementLabel,
  lockedActionLabel,
}: NeighborhoodStreamItem): NeighborhoodStreamItem {
  return {
    id: `fallback-${id}`,
    category,
    label,
    tone,
    title,
    description,
    href,
    mediaFallback,
    meta,
    engagementLabel,
    lockedActionLabel,
  };
}

export function buildNeighborhoodStreamItems({
  posts,
  businesses,
  services,
  classifieds,
  gastronomyItems,
  urls,
}: {
  posts: Post[];
  businesses: FeaturedBusiness[];
  services: FeaturedService[];
  classifieds: FeaturedClassified[];
  gastronomyItems: FeaturedBusiness[];
  urls: NeighborhoodStreamUrls;
}): NeighborhoodStreamGroups {
  const postItems: NeighborhoodStreamItem[] = posts.slice(0, 4).map((post) => {
    const postType = getPostTypeLabel(post.type);
    return {
      id: `post-${post.id}`,
      category: "feed",
      label: postType.label,
      tone: postType.tone,
      title: getTextPreview(post.content, 72),
      description: getTextPreview(post.content, 128),
      href: withQueryParams(urls.feed, { post: post.id }),
      mediaFallback: MessageCircle,
      meta: `${getPostAuthorName(post)} • ${formatRelativeTime(post.created_at)}`,
      engagementLabel: `${formatMetric(post.comments_count ?? 0)} comentários`,
      lockedActionLabel: "Entrar para comentar",
    };
  });

  const businessItem: NeighborhoodStreamItem[] = businesses.slice(0, 4).map((business) => ({
    id: `business-${business.id}`,
    category: "business",
    label: "NEGÓCIO LOCAL",
    tone: "blue",
    title: business.name || "Empresa local",
    description: formatCategory(business.category || "Empresa do bairro"),
    href: getBusinessPublicUrl(business, urls.business),
    mediaFallback: Store,
    meta: business.rating
      ? `★ ${business.rating.toFixed(1).replace(".", ",")} • ${business.is_verified ? "verificada" : "local"}`
      : "Empresa do bairro",
    engagementLabel: "Ver detalhes",
  }));

  const serviceItem: NeighborhoodStreamItem[] = services.slice(0, 4).map((service) => ({
    id: `service-${service.id}`,
    category: "services",
    label: "SERVIÇO LOCAL",
    tone: "cyan",
    title: service.name || formatCategory(service.category || "Serviço local"),
    description: formatCategory(service.category || "Profissional próximo"),
    href: urls.services,
    mediaFallback: Wrench,
    meta: `${service.rating ? `★ ${service.rating.toFixed(1).replace(".", ",")} • ` : ""}${service.price_range || "A combinar"}`,
    engagementLabel: "Pedir indicação",
    lockedActionLabel: "Entrar para recomendar",
  }));

  const classifiedItem: NeighborhoodStreamItem[] = classifieds.slice(0, 4).map((classified) => ({
    id: `classified-${classified.id}`,
    category: "classifieds",
    label: "CLASSIFICADO",
    tone: "amber",
    title: classified.titulo,
    description: formatCategory(classified.category || "Classificado do bairro"),
    href: classifiedUrlService.buildPublicUrl({
      id: classified.id,
      public_id: classified.public_id,
      slug: classified.slug,
      geographic_path: classified.geographic_path,
      category_slug: classified.category_slug,
      subcategory_slug: classified.subcategory_slug,
    }) ?? urls.classifieds,
    mediaFallback: Tag,
    meta: classified.price ? formatPrice(classified.price) : "Anúncio local",
    engagementLabel: "Ver anúncio",
  }));

  const gastronomyItem: NeighborhoodStreamItem[] = gastronomyItems.slice(0, 4).map((restaurant) => ({
    id: `gastronomy-${restaurant.id}`,
    category: "gastronomy",
    label: "GASTRONOMIA",
    tone: "green",
    title: restaurant.name || "Restaurante local",
    description: formatCategory(restaurant.category || "Gastronomia do bairro"),
    href: getBusinessPublicUrl(restaurant, urls.gastronomy),
    mediaFallback: UtensilsCrossed,
    meta: restaurant.rating ? `★ ${restaurant.rating.toFixed(1).replace(".", ",")} • Restaurante` : "Restaurante do bairro",
    engagementLabel: "Salvar",
    lockedActionLabel: "Entrar para avaliar",
  }));

  const mapItem: NeighborhoodStreamItem[] = [{
    id: "map-summary",
    category: "map",
    label: "MAPA",
    tone: "cyan",
    title: "Mapa vivo do bairro",
    description: "Veja limites do território, negócios, serviços, classificados e restaurantes próximos.",
    href: urls.map,
    mediaFallback: MapIcon,
    meta: "Território e pontos locais",
    engagementLabel: "Abrir mapa completo",
  }];

  const fallbackPostItem = buildFallbackItem({
    id: "feed",
    category: "feed",
    label: "COMUNIDADE",
    tone: "cyan",
    title: "Acompanhe o feed público do bairro",
    description: "Avisos, pedidos, recomendações e conversas de moradores aparecem aqui quando publicados.",
    href: urls.feed,
    mediaFallback: MessageCircle,
    meta: "Leitura pública",
    engagementLabel: "Abrir feed",
  });

  const fallbackBusinessItem = buildFallbackItem({
    id: "business",
    category: "business",
    label: "NEGÓCIOS",
    tone: "blue",
    title: "Empresas do bairro",
    description: "Veja estabelecimentos cadastrados neste território e filtros por categoria.",
    href: urls.business,
    mediaFallback: Store,
    meta: "Cadastros ativos",
    engagementLabel: "Ver empresas",
  });

  const fallbackServiceItem = buildFallbackItem({
    id: "services",
    category: "services",
    label: "SERVIÇO LOCAL",
    tone: "cyan",
    title: "Serviços próximos",
    description: "Encontre profissionais do bairro e recomendações conectadas à comunidade.",
    href: urls.services,
    mediaFallback: Wrench,
    meta: "Profissionais locais",
    engagementLabel: "Ver serviços",
  });

  const fallbackClassifiedItem = buildFallbackItem({
    id: "classifieds",
    category: "classifieds",
    label: "CLASSIFICADOS",
    tone: "amber",
    title: "Classificados da comunidade",
    description: "Anúncios de compra, venda, aluguel e oportunidades aparecem no contexto do bairro.",
    href: urls.classifieds,
    mediaFallback: Tag,
    meta: "Anúncios locais",
    engagementLabel: "Ver classificados",
  });

  const fallbackGastronomyItem = buildFallbackItem({
    id: "gastronomy",
    category: "gastronomy",
    label: "GASTRONOMIA",
    tone: "green",
    title: "Gastronomia perto de você",
    description: "Restaurantes, bares e comidas locais aparecem por proximidade e território.",
    href: urls.gastronomy,
    mediaFallback: UtensilsCrossed,
    meta: "Comida local",
    engagementLabel: "Ver gastronomia",
  });

  const feedGroup = postItems.length > 0 ? postItems : [fallbackPostItem];
  const businessGroup = businessItem.length > 0 ? businessItem : [fallbackBusinessItem];
  const serviceGroup = serviceItem.length > 0 ? serviceItem : [fallbackServiceItem];
  const classifiedGroup = classifiedItem.length > 0 ? classifiedItem : [fallbackClassifiedItem];
  const gastronomyGroup = gastronomyItem.length > 0 ? gastronomyItem : [fallbackGastronomyItem];

  return {
    all: [
      feedGroup[0],
      serviceGroup[0],
      classifiedGroup[0],
      gastronomyGroup[0],
      feedGroup[1],
      businessGroup[0],
      feedGroup[2],
      mapItem[0],
    ].filter((item): item is NeighborhoodStreamItem => Boolean(item)).slice(0, 7),
    feed: feedGroup,
    business: businessGroup,
    services: serviceGroup,
    classifieds: classifiedGroup,
    gastronomy: gastronomyGroup,
    map: mapItem,
  };
}

export function getNeighborhoodStreamMoreConfig(
  tab: NeighborhoodCommunityTabId,
  urls: NeighborhoodStreamUrls,
): NeighborhoodStreamMoreConfig {
  switch (tab) {
    case "feed":
      return {
        href: urls.feed,
        label: "Ver mais publicações",
        emptyTitle: "Feed público do bairro",
        emptyDescription: "Quando moradores publicarem avisos, pedidos e recomendações, eles aparecem aqui.",
        emptyAction: "Abrir feed",
      };
    case "business":
      return {
        href: urls.business,
        label: "Ver mais empresas",
        emptyTitle: "Empresas do bairro",
        emptyDescription: "Empresas cadastradas neste território aparecem neste resumo.",
        emptyAction: "Abrir empresas",
      };
    case "services":
      return {
        href: urls.services,
        label: "Ver mais serviços",
        emptyTitle: "Serviços do bairro",
        emptyDescription: "Profissionais e prestadores locais aparecem aqui quando ativos.",
        emptyAction: "Abrir serviços",
      };
    case "classifieds":
      return {
        href: urls.classifieds,
        label: "Ver mais classificados",
        emptyTitle: "Classificados do bairro",
        emptyDescription: "Anúncios publicados no contexto do bairro aparecem neste espaço.",
        emptyAction: "Abrir classificados",
      };
    case "gastronomy":
      return {
        href: urls.gastronomy,
        label: "Ver mais gastronomia",
        emptyTitle: "Gastronomia do bairro",
        emptyDescription: "Restaurantes, bares e comidas locais cadastrados aparecem aqui.",
        emptyAction: "Abrir gastronomia",
      };
    case "map":
      return {
        href: urls.map,
        label: "Ver mapa completo",
        emptyTitle: "Mapa do bairro",
        emptyDescription: "O mapa completo abre os limites do território e os pontos ativos.",
        emptyAction: "Abrir mapa",
      };
    case "all":
    default:
      return {
        href: urls.feed,
        label: "Ver mais publicações",
        emptyTitle: "Conteúdo público do bairro",
        emptyDescription: "Quando houver publicações, empresas, serviços e anúncios ativos, eles aparecem neste stream.",
        emptyAction: "Abrir feed",
      };
  }
}
