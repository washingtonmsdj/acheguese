/**
 * CommunityAlertService - SSOT for community alerts data access.
 *
 * Rules:
 * - No direct DB access outside this service
 * - Creation must happen via RPC (create_community_alert)
 * - Hooks should only orchestrate loading/error state
 */

import { supabase } from "@/integrations/supabase";
import { callRPC, insertLooseRow } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { SessionService } from "@/core/session/services/SessionService";
import type {
  AlertCategory,
  AlertFeedFilters,
  AlertRpcResult,
  AlertStartedApprox,
  AlertStatus,
  CommunityAlertPublic,
  CreateAlertPayload,
  UpdateAlertPayload,
} from "../domain/types";

type CommunityAlertsRow = any;

class CommunityAlertServiceClass {
  private readonly TABLE = "community_alerts";
  private readonly DB_SELECT = `
    id,
    profile_id,
    type,
    status,
    location_id,
    latitude,
    longitude,
    neighborhood_display,
    city,
    title,
    description,
    report_count,
    edit_count,
    created_at,
    updated_at,
    removed_at
  `;
  private readonly DEFAULT_LIMIT = 50;
  private readonly DEFAULT_SPATIAL_LIMIT = 200;
  private readonly DEFAULT_ALERT_TTL_MS = 24 * 60 * 60 * 1000;

  private readonly CATEGORY_VALUES: AlertCategory[] = [
    "tiroteio_disparos",
    "assalto_em_andamento",
    "tentativa_de_invasao",
    "incendio_explosao",
    "acidente_grave",
    "alagamento_deslizamento",
    "risco_na_via",
    "pessoa_vulneravel_em_risco",
  ];

  private readonly STARTED_APPROX_DEFAULT: AlertStartedApprox = "just_now";
  private readonly FALLBACK_CATEGORY: AlertCategory = "risco_na_via";

  async getCountByProfile(profileId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId);

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error(
        "CommunityAlertService.getCountByProfile",
        error,
        this._errorContext(error)
      );
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Reads
  // --------------------------------------------------------------------------

  async getAlerts(filters: AlertFeedFilters): Promise<CommunityAlertPublic[]> {
    try {
      const requestedLimit = filters.limit ?? this.DEFAULT_LIMIT;
      const fetchLimit = Math.min(requestedLimit * 3, 300);

      let query = supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      if (filters.location_id) {
        query = query.eq("location_id", filters.location_id);
      } else if (filters.location_ids && filters.location_ids.length > 0) {
        query = query.in("location_id", filters.location_ids);
      }

      if (filters.category) {
        query = query.eq("type", filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return this._toPublicList(data)
        .filter((alert) => alert.status === "ativo")
        .slice(0, requestedLimit);
    } catch (error) {
      logger.error(
        "CommunityAlertService.getAlerts",
        error,
        this._errorContext(error)
      );
      return [];
    }
  }

  async getByTerritory(
    territoryFilter: import("@/core/location/types").TerritoryFilter,
    options: { category?: import("../domain/types").AlertCategory; limit?: number } = {}
  ): Promise<CommunityAlertPublic[]> {
    const { category, limit = this.DEFAULT_LIMIT } = options;
    const filters: AlertFeedFilters = { limit };

    if (territoryFilter.scope === "location") {
      filters.location_id = territoryFilter.location_id;
    } else if (territoryFilter.scope === "group") {
      filters.location_ids = territoryFilter.location_ids;
    } else {
      return [];
    }

    if (category) filters.category = category;
    return this.getAlerts(filters);
  }

  async getAlertById(alertId: string): Promise<CommunityAlertPublic | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .eq("id", alertId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return this._toPublic(data);
    } catch (error) {
      logger.error(
        "CommunityAlertService.getAlertById",
        error,
        this._errorContext(error)
      );
      return null;
    }
  }

  async getAlertsByProfile(
    profileId: string,
    limit = 20
  ): Promise<CommunityAlertPublic[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return this._toPublicList(data).slice(0, limit);
    } catch (error) {
      logger.error(
        "CommunityAlertService.getAlertsByProfile",
        error,
        this._errorContext(error)
      );
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Create / Update / End / Remove
  // --------------------------------------------------------------------------

  async createAlert(payload: CreateAlertPayload): Promise<AlertRpcResult> {
    try {
      const { data, error } = await callRPC<AlertRpcResult>("create_community_alert", {
        payload: payload as any,
      });

      if (error) {
        logger.error(
          "CommunityAlertService.createAlert RPC error",
          error,
          this._errorContext(error)
        );
        return { error: "internal_error", detail: String(error) };
      }

      return data ?? { error: "internal_error" };
    } catch (error) {
      logger.error(
        "CommunityAlertService.createAlert",
        error,
        this._errorContext(error)
      );
      return { error: "internal_error", detail: String(error) };
    }
  }

  async updateAlert(alertId: string, payload: UpdateAlertPayload): Promise<boolean> {
    try {
      const { error: rpcError } = await callRPC<unknown>("increment_alert_edit_count", {
        p_alert_id: alertId,
      });
      if (rpcError) throw rpcError;

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof payload.description === "string") {
        updateData.description = payload.description;
      }

      // Domain still_risky does not exist in current DB schema.
      // We map it to status to preserve intent until the schema converges.
      if (typeof payload.still_risky === "boolean") {
        updateData.status = payload.still_risky ? "ativo" : "encerrado";
      }

      const { error } = await supabase
        .from(this.TABLE)
        .update(updateData)
        .eq("id", alertId);

      if (error) throw error;

      await this._auditLog(alertId, "updated", payload as Record<string, unknown>);
      return true;
    } catch (error) {
      logger.error(
        "CommunityAlertService.updateAlert",
        error,
        this._errorContext(error)
      );
      return false;
    }
  }

  async endAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          status: "encerrado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;

      await this._auditLog(alertId, "ended", {});
      return true;
    } catch (error) {
      logger.error(
        "CommunityAlertService.endAlert",
        error,
        this._errorContext(error)
      );
      return false;
    }
  }

  async removeAlert(alertId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          status: "removido",
          removed_at: new Date().toISOString(),
          removal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;

      await this._auditLog(alertId, "removed", { reason });
      return true;
    } catch (error) {
      logger.error(
        "CommunityAlertService.removeAlert",
        error,
        this._errorContext(error)
      );
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Spatial search (map)
  // --------------------------------------------------------------------------

  async getBySpatialRadius(
    center: [number, number],
    radiusMeters: number,
    options: {
      limit?: number;
      territoryFilter?: import("@/core/location/types").TerritoryFilter;
    } = {}
  ): Promise<CommunityAlertPublic[]> {
    const [centerLat, centerLng] = center;
    const { territoryFilter } = options;
    const requestedLimit = options.limit ?? this.DEFAULT_SPATIAL_LIMIT;
    const fetchLimit = Math.min(requestedLimit * 3, 600);

    try {
      if (territoryFilter?.scope === "none") return [];

      let query = supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      if (territoryFilter?.scope === "location") {
        query = query.eq("location_id", territoryFilter.location_id);
      } else if (
        territoryFilter?.scope === "group" &&
        territoryFilter.location_ids.length > 0
      ) {
        query = query.in("location_id", territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      return this._toPublicList(data)
        .filter((alert) => alert.status === "ativo")
        .filter((alert) => {
          if (alert.latitude == null || alert.longitude == null) return false;
          const distance = this._calculateDistance(
            centerLat,
            centerLng,
            alert.latitude,
            alert.longitude
          );
          return distance <= radiusMeters;
        })
        .slice(0, requestedLimit);
    } catch (error) {
      logger.error(
        "CommunityAlertService.getBySpatialRadius",
        error,
        this._errorContext(error)
      );
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  private async _auditLog(
    alertId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) return;

      const { error } = await insertLooseRow("community_alert_audit", {
        alert_id: alertId,
        actor_id: user.id,
        action_type: action,
        metadata,
      });
      if (error) throw error;
    } catch (error) {
      logger.error("CommunityAlertService._auditLog", error, this._errorContext(error));
    }
  }

  private _toPublicList(rows: CommunityAlertsRow[] | null): CommunityAlertPublic[] {
    return ((rows ?? []) as any[]).map((row) => this._toPublic(row as CommunityAlertsRow));
  }

  private _toPublic(row: CommunityAlertsRow): CommunityAlertPublic {
    const createdAt = this._toIso(row.created_at);
    const updatedAt = this._toIso(row.updated_at, createdAt);
    const status = this._normalizeStatus(row.status, row.removed_at);
    const expiresAt = new Date(
      new Date(createdAt).getTime() + this.DEFAULT_ALERT_TTL_MS
    ).toISOString();
    const endedAt = status === "ativo" ? undefined : updatedAt;

    return {
      id: row.id,
      author_profile_id: row.profile_id,
      category: this._normalizeCategory(row.type),
      status,
      location_id: row.location_id ?? "",
      latitude: this._toNullableNumber(row.latitude),
      longitude: this._toNullableNumber(row.longitude),
      neighborhood_display: row.neighborhood_display,
      city: row.city,
      description: row.description?.trim() || row.title || "Alerta da comunidade",
      seen_personally: true,
      started_at_approx: this.STARTED_APPROX_DEFAULT,
      is_happening_now: status === "ativo",
      still_risky: status === "ativo",
      expires_at: expiresAt,
      report_count: row.report_count ?? 0,
      edit_count: row.edit_count ?? 0,
      created_at: createdAt,
      updated_at: updatedAt,
      ended_at: endedAt,
    };
  }

  private _normalizeStatus(rawStatus: string, removedAt: string | null): AlertStatus {
    if (removedAt) return "removido";

    const normalized = rawStatus.trim().toLowerCase();
    if (normalized === "ativo" || normalized === "active" || normalized === "open") {
      return "ativo";
    }
    if (normalized.includes("expir")) return "expirado";
    if (
      normalized.includes("remov") ||
      normalized.includes("deleted") ||
      normalized.includes("removed")
    ) {
      return "removido";
    }
    return "encerrado";
  }

  private _normalizeCategory(rawType: string): AlertCategory {
    if (this.CATEGORY_VALUES.includes(rawType as AlertCategory)) {
      return rawType as AlertCategory;
    }
    return this.FALLBACK_CATEGORY;
  }

  private _toIso(value: string | null, fallback?: string): string {
    if (value) return value;
    return fallback ?? new Date().toISOString();
  }

  private _toNullableNumber(value: number | null): number | null {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return value;
  }

  private _errorContext(error: unknown): Record<string, unknown> {
    if (!error || typeof error !== "object") {
      return { error: String(error) };
    }

    const err = error as Record<string, unknown>;
    return {
      code: err.code ?? null,
      message: err.message ?? String(error),
      details: err.details ?? null,
      hint: err.hint ?? null,
      status: err.status ?? null,
    };
  }

  private _calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const earthRadius = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }
}

export const communityAlertService = new CommunityAlertServiceClass();
