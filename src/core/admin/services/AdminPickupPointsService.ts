import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
};

type AdminPickupPointsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminPickupPointsDbClient;

export interface PickupPoint {
  id: string;
  location_id: string;
  location_name?: string | null;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  capacity: number;
  has_shelter: boolean;
  has_bench: boolean;
  has_lighting: boolean;
  accessibility: boolean;
  active: boolean;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreatePickupPointInput {
  location_id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  capacity: number;
  has_shelter: boolean;
  has_bench: boolean;
  has_lighting: boolean;
  accessibility: boolean;
  active: boolean;
  notes?: string;
}

type PickupPointRow = {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | string;
  longitude: number | string;
  type: string;
  capacity: number | string;
  has_shelter: boolean | null;
  has_bench: boolean | null;
  has_lighting: boolean | null;
  accessibility: boolean | null;
  active: boolean | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
  location?: {
    name?: string | null;
  } | null;
};

const pickupPointSelect = `
  id,
  location_id,
  name,
  description,
  address,
  latitude,
  longitude,
  type,
  capacity,
  has_shelter,
  has_bench,
  has_lighting,
  accessibility,
  active,
  photo_url,
  notes,
  created_at,
  updated_at,
  location:locations(name)
`;

function normalizeText(value?: string): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function mapPickupPoint(row: PickupPointRow): PickupPoint {
  return {
    id: row.id,
    location_id: row.location_id,
    location_name: row.location?.name ?? null,
    name: row.name,
    description: row.description,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    type: row.type,
    capacity: Number(row.capacity),
    has_shelter: Boolean(row.has_shelter),
    has_bench: Boolean(row.has_bench),
    has_lighting: Boolean(row.has_lighting),
    accessibility: Boolean(row.accessibility),
    active: Boolean(row.active),
    photo_url: row.photo_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at ?? undefined,
  };
}

class AdminPickupPointsService {
  async getAllPickupPoints(locationId?: string | null): Promise<PickupPoint[]> {
    try {
      let query = db
        .from<PickupPointRow>("pickup_points")
        .select(pickupPointSelect)
        .order("created_at", { ascending: false });

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(mapPickupPoint);
    } catch (error) {
      logger.error("AdminPickupPointsService.getAllPickupPoints", error as Error, { locationId });
      throw error;
    }
  }

  async createPickupPoint(input: CreatePickupPointInput): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        location_id: input.location_id,
        name: input.name.trim(),
        description: normalizeText(input.description),
        address: input.address.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
        type: input.type,
        capacity: input.capacity,
        has_shelter: input.has_shelter,
        has_bench: input.has_bench,
        has_lighting: input.has_lighting,
        accessibility: input.accessibility,
        active: input.active,
        notes: normalizeText(input.notes),
      };

      const { error } = await db.from<PickupPointRow>("pickup_points").insert(payload);
      if (error) throw error;
    } catch (error) {
      logger.error("AdminPickupPointsService.createPickupPoint", error as Error, input);
      throw error;
    }
  }

  async updatePickupPoint(id: string, input: Partial<CreatePickupPointInput>): Promise<void> {
    try {
      const patch: Record<string, unknown> = {};

      if (input.location_id !== undefined) patch.location_id = input.location_id;
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.description !== undefined) patch.description = normalizeText(input.description);
      if (input.address !== undefined) patch.address = input.address.trim();
      if (input.latitude !== undefined) patch.latitude = input.latitude;
      if (input.longitude !== undefined) patch.longitude = input.longitude;
      if (input.type !== undefined) patch.type = input.type;
      if (input.capacity !== undefined) patch.capacity = input.capacity;
      if (input.has_shelter !== undefined) patch.has_shelter = input.has_shelter;
      if (input.has_bench !== undefined) patch.has_bench = input.has_bench;
      if (input.has_lighting !== undefined) patch.has_lighting = input.has_lighting;
      if (input.accessibility !== undefined) patch.accessibility = input.accessibility;
      if (input.active !== undefined) patch.active = input.active;
      if (input.notes !== undefined) patch.notes = normalizeText(input.notes);

      if (Object.keys(patch).length === 0) return;

      const { error } = await db.from<PickupPointRow>("pickup_points").update(patch).eq("id", id);
      if (error) throw error;
    } catch (error) {
      logger.error("AdminPickupPointsService.updatePickupPoint", error as Error, { id, input });
      throw error;
    }
  }

  async deletePickupPoint(id: string): Promise<void> {
    try {
      const { error } = await db.from<PickupPointRow>("pickup_points").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      logger.error("AdminPickupPointsService.deletePickupPoint", error as Error, { id });
      throw error;
    }
  }

  async togglePickupPointActive(id: string, active: boolean): Promise<void> {
    await this.updatePickupPoint(id, { active });
  }
}

export const adminPickupPointsService = new AdminPickupPointsService();
