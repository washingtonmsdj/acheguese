import { ProfessionalService } from "@/core/professional";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { logger } from "@/shared/utils/logger";
import type { Professional } from "@/core/professional/types";
import type { AIActionContext, AIActionResultItem, AIIntent } from "../domain/types";
import type { IActionHandler } from "./IActionHandler";

async function professionalUrl(professional: Professional): Promise<string | undefined> {
  if (!professional.slug) return undefined;

  if (professional.geographic_path) {
    const canonical = ProfessionalUrlService.getCanonicalUrlFromGeographicPath({
      id: professional.profile_id,
      slug: professional.slug,
      geographicPath: professional.geographic_path,
    });
    if (canonical) return canonical;
  }

  try {
    const ctx = professional.professional_data_id
      ? await ProfessionalUrlService.resolveByProfessionalDataId(professional.professional_data_id)
      : await ProfessionalUrlService.resolveById(professional.profile_id);
    return ctx ? ProfessionalUrlService.getCanonicalUrl(ctx) : undefined;
  } catch (error) {
    logger.warn("[AI] Professional URL unavailable for search result", {
      professionalId: professional.profile_id,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

export class SearchServicesActionHandler implements IActionHandler {
  readonly type = "service_search" as const;

  async execute(intent: AIIntent, context: AIActionContext): Promise<AIActionResultItem[]> {
    let professionals: Professional[] = [];
    try {
      professionals = await ProfessionalService.getProfessionals({
        search: intent.normalizedQuery,
        category: intent.filters.category,
        territoryFilter: context.territoryFilter,
        sortBy: "rating",
      });
    } catch (error) {
      logger.warn("[AI] Service search failed; returning empty controlled state", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }

    return Promise.all(
      professionals.slice(0, 20).map(async (professional) => ({
        id: professional.profile_id,
        kind: "service" as const,
        title: professional.name,
        subtitle: professional.category,
        description: professional.description,
        imageUrl: professional.logo_url,
        url: await professionalUrl(professional),
        rating: professional.rating,
        badges: [
          professional.is_verified ? "verificado" : null,
          professional.is_accepting_clients ? "aceita clientes" : null,
          professional.price_range,
        ].filter((item): item is string => Boolean(item)),
      })),
    );
  }
}
