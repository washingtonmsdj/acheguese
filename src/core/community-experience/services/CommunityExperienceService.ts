import { supabase } from "@/integrations/supabase";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type CommunityStatus = "active" | "launching" | "waiting_list" | "coming_soon" | "inactive";
export type CommunityTerritoryType = "district" | "territorial_group";

export interface TerritorialCommunityProfile {
  id: string;
  name: string;
  slug: string;
  city_id: string | null;
  territory_type: CommunityTerritoryType;
  territory_id: string;
  status: CommunityStatus;
  headline: string | null;
  description: string | null;
  launch_message: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  primary_cta_label: string | null;
  secondary_cta_label: string | null;
  is_featured: boolean;
  sort_order: number;
}

const COMPLEXO_SLUG = "complexo-do-nordeste-de-amaralina";
const PITUBA_SLUG = "pituba";

function fallbackFromResolved(resolved: ResolvedTerritory): TerritorialCommunityProfile {
  if (resolved.kind === "group" && resolved.group.slug === COMPLEXO_SLUG) {
    return {
      id: "community-complexo",
      name: "Achegue-se Complexo",
      slug: COMPLEXO_SLUG,
      city_id: null,
      territory_type: "territorial_group",
      territory_id: resolved.group.id,
      status: "active",
      headline: "A comunidade digital do Complexo",
      description: "Moradores, comercios, servicos, alertas, eventos e oportunidades do Complexo em um so lugar.",
      launch_message: null,
      hero_title: "Achegue-se Complexo",
      hero_subtitle: "O que esta acontecendo no Complexo hoje?",
      primary_cta_label: "Entrar na comunidade",
      secondary_cta_label: "Comercios do Complexo",
      is_featured: true,
      sort_order: 1,
    };
  }

  if (resolved.kind === "location" && resolved.location.slug === PITUBA_SLUG) {
    return {
      id: "community-pituba",
      name: "Achegue-se Pituba",
      slug: PITUBA_SLUG,
      city_id: resolved.location.parent_id ?? null,
      territory_type: "district",
      territory_id: resolved.location.id,
      status: "coming_soon",
      headline: "Achegue-se Pituba esta chegando",
      description: "Em breve, moradores, comercios, servicos e oportunidades da Pituba em um so lugar.",
      launch_message: "Cadastre seu interesse e indique um comercio da Pituba.",
      hero_title: "Achegue-se Pituba esta chegando",
      hero_subtitle: "A proxima comunidade planejada do Achegue-se em Salvador.",
      primary_cta_label: "Cadastrar interesse",
      secondary_cta_label: "Quero minha empresa na Pituba",
      is_featured: true,
      sort_order: 2,
    };
  }

  if (resolved.kind === "location" && resolved.location.type === "district") {
    return {
      id: `community-${resolved.location.slug}`,
      name: `Achegue-se ${resolved.location.name}`,
      slug: resolved.location.slug,
      city_id: resolved.location.parent_id ?? null,
      territory_type: "district",
      territory_id: resolved.location.id,
      status: "inactive",
      headline: null,
      description: null,
      launch_message: null,
      hero_title: null,
      hero_subtitle: null,
      primary_cta_label: null,
      secondary_cta_label: null,
      is_featured: false,
      sort_order: 99,
    };
  }

  return {
    id: "community-city-default",
    name: "Comunidade local",
    slug: resolved.kind === "group" ? resolved.group.slug : resolved.location.slug,
    city_id: null,
    territory_type: resolved.kind === "group" ? "territorial_group" : "district",
    territory_id: resolved.kind === "group" ? resolved.group.id : resolved.location.id,
    status: "inactive",
    headline: null,
    description: null,
    launch_message: null,
    hero_title: null,
    hero_subtitle: null,
    primary_cta_label: null,
    secondary_cta_label: null,
    is_featured: false,
    sort_order: 100,
  };
}

export class CommunityExperienceService {
  static async getCommunityProfile(resolved: ResolvedTerritory): Promise<TerritorialCommunityProfile> {
    if (!resolved) {
      throw new Error("resolved territory is required");
    }

    const territoryType: CommunityTerritoryType = resolved.kind === "group" ? "territorial_group" : "district";
    const territoryId = resolved.kind === "group" ? resolved.group.id : resolved.location.id;

    try {
      const { data, error } = await supabase
        .from("territory_communities" as never)
        .select("*")
        .eq("territory_type", territoryType)
        .eq("territory_id", territoryId)
        .maybeSingle();

      if (!error && data) {
        return data as TerritorialCommunityProfile;
      }
    } catch {
      // fallback handled below
    }

    return fallbackFromResolved(resolved);
  }
}
