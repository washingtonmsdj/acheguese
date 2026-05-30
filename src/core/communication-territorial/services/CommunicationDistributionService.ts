import { selectLooseRows } from "@/integrations/supabase/services/supabaseHelpers";
import {
  buildCommunicationChannelUrl,
  type CommunicationChannelUrlParts,
} from "../utils/communicationTerritorialUrls";
import type {
  CommunicationChannel,
  CommunicationDistributionTarget,
  CommunicationLocation,
  CommunicationPublication,
  CommunicationPublicationDistribution,
  PublicationType,
} from "../types";

type LooseFilter =
  | { op: "eq"; column: string; value: unknown }
  | { op: "in"; column: string; values: unknown[] };

function dbError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message?: unknown }).message ?? fallback));
  }
  return new Error(fallback);
}

async function selectRows<TRow>(
  tableName: string,
  options: Parameters<typeof selectLooseRows<Record<string, unknown>>>[1] = {},
): Promise<TRow[]> {
  const { data, error } = await selectLooseRows<Record<string, unknown>>(tableName, options);
  if (error) throw dbError(error, `Query ${tableName} failed`);
  return (data ?? []) as TRow[];
}

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function attachRelations(
  distributions: CommunicationPublicationDistribution[],
  publications: CommunicationPublication[],
  channels: CommunicationChannel[],
  locations: CommunicationLocation[],
): CommunicationPublicationDistribution[] {
  const publicationMap = byId(publications);
  const channelMap = byId(channels);
  const locationMap = byId(locations);

  return distributions.map((distribution) => ({
    ...distribution,
    publication: publicationMap.get(distribution.publication_id),
    channel: channelMap.get(distribution.channel_id),
    location: locationMap.get(distribution.location_id),
  }));
}

export class CommunicationDistributionService {
  static async listDistributedPublications(options: {
    locationIds: string[];
    targetType?: CommunicationDistributionTarget;
    publicationType?: PublicationType;
    limit?: number;
  }): Promise<CommunicationPublicationDistribution[]> {
    if (!options.locationIds.length) return [];

    const filters: LooseFilter[] = [
      { op: "eq", column: "is_active", value: true },
      { op: "in", column: "location_id", values: options.locationIds },
      { op: "eq", column: "target_type", value: options.targetType ?? "community_tab" },
    ];

    const distributions = await selectRows<CommunicationPublicationDistribution>(
      "communication_publication_distribution",
      {
        filters,
        orderBy: { column: "rank_score", ascending: false },
        limit: options.limit ?? 40,
      },
    );

    const publicationIds = unique(distributions.map((distribution) => distribution.publication_id));
    if (!publicationIds.length) return [];

    const publicationFilters: LooseFilter[] = [
      { op: "eq", column: "status", value: "published" },
      { op: "in", column: "id", values: publicationIds },
    ];
    if (options.publicationType) {
      publicationFilters.push({ op: "eq", column: "publication_type", value: options.publicationType });
    }

    const publications = await selectRows<CommunicationPublication>("communication_publications", {
      filters: publicationFilters,
      orderBy: { column: "published_at", ascending: false },
      limit: options.limit ?? 40,
    });

    const visiblePublicationIds = new Set(publications.map((publication) => publication.id));
    const visibleDistributions = distributions.filter((distribution) =>
      visiblePublicationIds.has(distribution.publication_id),
    );
    if (!visibleDistributions.length) return [];

    const [channels, locations] = await Promise.all([
      selectRows<CommunicationChannel>("communication_channels", {
        filters: [
          { op: "eq", column: "status", value: "active" },
          { op: "in", column: "id", values: unique(visibleDistributions.map((distribution) => distribution.channel_id)) },
        ],
        limit: 100,
      }),
      selectRows<CommunicationLocation>("locations", {
        columns: "id,name,full_name,slug,type,parent_id",
        filters: [{ op: "in", column: "id", values: unique(visibleDistributions.map((distribution) => distribution.location_id)) }],
        limit: 200,
      }),
    ]);

    const hydrated = attachRelations(visibleDistributions, publications, channels, locations);
    return hydrated.filter((distribution) => distribution.publication && distribution.channel);
  }

  static resolvePublicationInteraction(
    distribution: CommunicationPublicationDistribution,
    params: Pick<CommunicationChannelUrlParts, "state" | "city">,
  ): { mode: "canonical" | "inline"; href?: string } {
    const publication = distribution.publication;
    const channel = distribution.channel;

    if (!publication || !channel) return { mode: "inline" };
    if (publication.content_format === "update") return { mode: "inline" };

    return {
      mode: "canonical",
      href: buildCommunicationChannelUrl({ ...params, channelSlug: channel.slug }),
    };
  }
}
