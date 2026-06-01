import { supabase } from "@/integrations/supabase";
import { selectLooseRows } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { PublicIdentityService } from "@/core/public-identity";
import type {
  CommunicationChannel,
  CommunicationChannelTerritory,
  CommunicationHubData,
  CommunicationLocation,
  CommunicationPublication,
  CreateCommunicationPublicationInput,
  RequestCommunicationChannelInput,
} from "../types";
import { parseRequestCommunicationChannelInput } from "../domain/requestChannelSchema";

type RpcResult<T> = { data: T | null; error: { message?: string } | null };
type RpcPayload = Record<string, unknown>;

function dbError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message?: unknown }).message ?? fallback));
  }
  return new Error(fallback);
}

async function callLooseRpc<T>(functionName: string, params?: RpcPayload): Promise<T> {
  const result = (await supabase.rpc(
    functionName as never,
    (params ?? {}) as never,
  )) as unknown as RpcResult<T>;

  if (result.error) throw dbError(result.error, `RPC ${functionName} failed`);
  if (result.data === null) throw new Error(`RPC ${functionName} returned no data`);
  return result.data;
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

function attachPublicationRelations(
  publications: CommunicationPublication[],
  channels: CommunicationChannel[],
  locations: CommunicationLocation[],
): CommunicationPublication[] {
  const channelMap = byId(channels);
  const locationMap = byId(locations);
  return publications.map((publication) => ({
    ...publication,
    channel: channelMap.get(publication.channel_id),
    location: locationMap.get(publication.location_id),
  }));
}

export class CommunicationTerritorialService {
  static async requestChannel(input: RequestCommunicationChannelInput): Promise<{ request_id: string; status: string }> {
    const sanitizedInput = parseRequestCommunicationChannelInput(input);
    return callLooseRpc("request_communication_channel", { payload: sanitizedInput });
  }

  static async createPublication(input: CreateCommunicationPublicationInput): Promise<{ publication_id: string; status: string }> {
    return callLooseRpc("create_communication_publication", { payload: input });
  }

  static async publishPublication(publicationId: string): Promise<{ publication_id: string; status: string }> {
    return callLooseRpc("publish_communication_publication", { publication_id: publicationId });
  }

  static async updateDraftPublication(input: {
    publication_id: string;
    location_id?: string;
    publication_type?: string;
    content_format?: string;
    title?: string;
    summary?: string;
    body?: string;
    source_url?: string;
    media?: Record<string, unknown>;
  }): Promise<{ publication_id: string; status: string }> {
    const { publication_id, ...payload } = input;
    return callLooseRpc("update_communication_publication_draft", {
      publication_id,
      payload,
    });
  }

  static async canChannelPublishInLocation(channelId: string, locationId: string): Promise<boolean> {
    return callLooseRpc("can_channel_publish_in_location", {
      channel_id: channelId,
      location_id: locationId,
    });
  }

  static async listLocations(): Promise<CommunicationLocation[]> {
    return selectRows<CommunicationLocation>("locations", {
      columns: "id,name,full_name,slug,type,parent_id",
      filters: [{ op: "eq", column: "status", value: "active" }],
      orderBy: { column: "name", ascending: true },
      limit: 500,
    });
  }

  static async listDistrictOptions(): Promise<CommunicationLocation[]> {
    const rows = await this.listLocations();
    return rows.filter((location) => ["district", "neighborhood", "city"].includes(location.type));
  }

  static async listActiveChannels(locationIds?: string[]): Promise<CommunicationChannel[]> {
    if (locationIds?.length) {
      const territories = await selectRows<CommunicationChannelTerritory>("communication_channel_territories", {
        columns: "id,channel_id,location_id,territory_role,can_publish,can_alert,can_push,approved_by_user_id,approved_at,created_at,updated_at",
        filters: [{ op: "in", column: "location_id", values: locationIds }],
        limit: 500,
      });
      const channelIds = [...new Set(territories.map((territory) => territory.channel_id))];
      if (!channelIds.length) return [];
      return selectRows<CommunicationChannel>("communication_channels", {
        filters: [
          { op: "eq", column: "status", value: "active" },
          { op: "in", column: "id", values: channelIds },
        ],
        orderBy: { column: "public_name", ascending: true },
        limit: 100,
      });
    }

    return selectRows<CommunicationChannel>("communication_channels", {
      filters: [{ op: "eq", column: "status", value: "active" }],
      orderBy: { column: "public_name", ascending: true },
      limit: 100,
    });
  }

  static async listPublications(options: {
    locationIds?: string[];
    channelId?: string;
    status?: "published" | "draft";
    limit?: number;
  } = {}): Promise<CommunicationPublication[]> {
    const filters: Array<{ op: "eq"; column: string; value: unknown } | { op: "in"; column: string; values: unknown[] }> = [
      { op: "eq", column: "status", value: options.status ?? "published" },
    ];

    if (options.channelId) filters.push({ op: "eq", column: "channel_id", value: options.channelId });
    if (options.locationIds?.length) filters.push({ op: "in", column: "location_id", values: options.locationIds });

    return selectRows<CommunicationPublication>("communication_publications", {
      filters,
      orderBy: { column: "published_at", ascending: false },
      limit: options.limit ?? 30,
    });
  }

  static async getChannelBySlug(slug: string): Promise<CommunicationChannel | null> {
    const normalizedSlug = PublicIdentityService.normalize(slug, "communication_channel");
    if (!normalizedSlug) return null;

    const channels = await selectRows<CommunicationChannel>("communication_channels", {
      filters: [
        { op: "eq", column: "slug", value: normalizedSlug },
        { op: "eq", column: "status", value: "active" },
      ],
      limit: 1,
    });
    return channels[0] ?? null;
  }

  static async getChannelPublicPage(slug: string): Promise<{
    channel: CommunicationChannel | null;
    territories: CommunicationChannelTerritory[];
    publications: CommunicationPublication[];
    locations: CommunicationLocation[];
  }> {
    const channel = await this.getChannelBySlug(slug);
    if (!channel) return { channel: null, territories: [], publications: [], locations: [] };

    const territories = await selectRows<CommunicationChannelTerritory>("communication_channel_territories", {
      filters: [{ op: "eq", column: "channel_id", value: channel.id }],
      limit: 100,
    });
    const locationIds = [...new Set(territories.map((territory) => territory.location_id))];
    const locations = locationIds.length
      ? await selectRows<CommunicationLocation>("locations", {
          columns: "id,name,full_name,slug,type,parent_id",
          filters: [{ op: "in", column: "id", values: locationIds }],
          limit: 100,
        })
      : [];
    const publications = attachPublicationRelations(
      await this.listPublications({ channelId: channel.id, limit: 50 }),
      [channel],
      locations,
    );

    const locationMap = byId(locations);
    return {
      channel,
      territories: territories.map((territory) => ({ ...territory, location: locationMap.get(territory.location_id) })),
      publications,
      locations,
    };
  }

  static async listManagedChannels(): Promise<CommunicationChannel[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const memberships = await selectRows<{ profile_id: string; role: string }>("profile_members", {
      columns: "profile_id,role",
      filters: [
        { op: "eq", column: "user_id", value: user.id },
        { op: "in", column: "role", values: ["owner", "admin"] },
      ],
      limit: 200,
    });
    const profileIds = [...new Set(memberships.map((membership) => membership.profile_id))];
    if (!profileIds.length) return [];

    return selectRows<CommunicationChannel>("communication_channels", {
      filters: [
        { op: "in", column: "profile_id", values: profileIds },
        { op: "eq", column: "status", value: "active" },
      ],
      orderBy: { column: "public_name", ascending: true },
      limit: 100,
    });
  }

  static async listAuthorizedTerritories(channelId: string): Promise<CommunicationChannelTerritory[]> {
    const territories = await selectRows<CommunicationChannelTerritory>("communication_channel_territories", {
      filters: [
        { op: "eq", column: "channel_id", value: channelId },
        { op: "eq", column: "can_publish", value: true },
      ],
      limit: 100,
    });
    const locationIds = [...new Set(territories.map((territory) => territory.location_id))];
    if (!locationIds.length) return territories;

    const locations = await selectRows<CommunicationLocation>("locations", {
      columns: "id,name,full_name,slug,type,parent_id",
      filters: [{ op: "in", column: "id", values: locationIds }],
      limit: 100,
    });
    const locationMap = byId(locations);
    return territories.map((territory) => ({ ...territory, location: locationMap.get(territory.location_id) }));
  }

  static async getPublicHub(params: {
    state?: string;
    city?: string;
  }): Promise<CommunicationHubData> {
    const { locationIds, title } = await this.resolveLocationScope(params);
    const [channels, publications, locations] = await Promise.all([
      this.listActiveChannels(locationIds),
      this.listPublications({ locationIds, limit: 40 }),
      this.listLocations(),
    ]);
    return {
      channels,
      publications: attachPublicationRelations(publications, channels, locations),
      locations,
      title,
    };
  }

  private static async resolveLocationScope(params: {
    state?: string;
    city?: string;
  }): Promise<{ locationIds?: string[]; title: string }> {
    if (!params.city) return { title: "Comunicacao Territorial" };

    const locations = await this.listLocations();
    const city = locations.find((location) => location.slug === params.city && location.type === "city");
    if (!city) return { locationIds: [], title: "Cidade nao encontrada" };

    const childIds = locations.filter((location) => location.parent_id === city.id).map((location) => location.id);
    return { locationIds: [city.id, ...childIds], title: `Comunicacao em ${city.name}` };
  }
}
