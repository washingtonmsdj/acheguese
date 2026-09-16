/**
 * PricingService
 *
 * Administrative/read repository for persisted pricing rules.
 * Transactional mobility prices are issued exclusively by mobility-pricing-rpc
 * as server-owned quotes. This service must not calculate customer fares.
 */
import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { PricingError } from "../types";
import type { AdditionalFee, PricingMode, PricingRule } from "../types";

type ErrorLike = {
  code?: string | null;
  hint?: string | null;
  message?: string | null;
};

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  eq(column: string, value: unknown): TableClient<TRow>;
  insert(
    values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>,
  ): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending?: boolean }): TableClient<TRow>;
  select(columns?: string): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
  update(values: Record<string, unknown>): TableClient<TRow>;
};

type PricingDbClient = {
  from<TRow>(table: string): TableClient<TRow>;
};

type PricingRuleRow = Tables<"pricing_rules">;
type PricingRuleInsert = TablesInsert<"pricing_rules">;
type PricingPeakHourMultiplierRow = Tables<"pricing_peak_hour_multipliers">;
type PricingAdditionalFeeRow = Tables<"pricing_additional_fees">;
type PricingAdditionalFeeInsert = TablesInsert<"pricing_additional_fees">;
type PricingAuditLogRow = Tables<"pricing_audit_log">;

type PricingRuleWithRelationsRow = PricingRuleRow & {
  additional_fees?: PricingAdditionalFeeRow[] | null;
  peak_hour_multipliers?: PricingPeakHourMultiplierRow[] | null;
};

type AdminPricingAction = "activatePricingRule" | "createActivePricingRule";

const pricingDb = supabase as unknown as PricingDbClient;
const ADMIN_PRICING_RPC_FUNCTION = "admin-pricing-rpc";
const CACHE_TTL_MS = 5 * 60 * 1000;

function toJsonMetadata(value: Record<string, unknown> | undefined): Json {
  return (value ?? {}) as Json;
}

function toMetadataRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function providerError(error: unknown): {
  message: string;
  code: string;
  hint: string;
} {
  const value =
    error && typeof error === "object"
      ? (error as { message?: string; code?: string; hint?: string })
      : undefined;
  return {
    message: value?.message || String(error),
    code: value?.code || "",
    hint: value?.hint || "",
  };
}

function assertNoClientPeakSchedule(
  multipliers: PricingRule["peakHourMultipliers"],
): void {
  if (!multipliers) return;
  const hasConfiguredMultiplier = Object.values(multipliers).some(
    (value) => value !== undefined,
  );
  if (hasConfiguredMultiplier) {
    throw PricingError.validation(
      "Peak-hour schedules are not writable through the client pricing repository. Use the server-owned persisted schedule contract.",
    );
  }
}

export class PricingService {
  private static instance: PricingService;
  private readonly db = pricingDb;
  private readonly rulesCache = new Map<
    PricingMode,
    { rule: PricingRule; cachedAt: number }
  >();

  private constructor() {}

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  private async invokeAdminPricingRpc<TValue>(
    action: AdminPricingAction,
    params: Record<string, unknown>,
  ): Promise<TValue | null> {
    return invokeNullableSupabaseBroker<TValue, AdminPricingAction>({
      action,
      functionName: ADMIN_PRICING_RPC_FUNCTION,
      params,
      serviceName: "PricingService",
    });
  }

  /**
   * Reads the currently active persisted rule. Missing/unavailable rules fail
   * closed; this repository never fabricates a monetary fallback.
   */
  async getRule(mode: PricingMode): Promise<PricingRule> {
    const cached = this.rulesCache.get(mode);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.rule;
    }

    try {
      const now = new Date().toISOString();
      const { data: ruleData, error: ruleError } = await this.db
        .from<PricingRuleRow>("pricing_rules")
        .select("*")
        .eq("mode", mode)
        .eq("is_active", true)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ruleError) throw ruleError;
      if (!ruleData) {
        throw PricingError.notFound(
          `No active persisted pricing rule is available for mode: ${mode}`,
        );
      }

      const [multipliersResult, feesResult] = await Promise.all([
        this.db
          .from<PricingPeakHourMultiplierRow>("pricing_peak_hour_multipliers")
          .select("*")
          .eq("rule_id", ruleData.id)
          .eq("is_active", true),
        this.db
          .from<PricingAdditionalFeeRow>("pricing_additional_fees")
          .select("*")
          .eq("rule_id", ruleData.id)
          .eq("is_active", true),
      ]);

      if (multipliersResult.error) throw multipliersResult.error;
      if (feesResult.error) throw feesResult.error;

      const rule = this.mapToRule(
        ruleData,
        multipliersResult.data || [],
        feesResult.data || [],
      );
      this.rulesCache.set(mode, { rule, cachedAt: Date.now() });
      return rule;
    } catch (error) {
      logger.error("[PricingService] Error fetching persisted pricing rule", error);
      trackError(error as Error, {
        component: "PricingService",
        action: "getRule",
        metadata: { mode },
      });
      throw error;
    }
  }

  async updateRule(
    ruleId: string,
    updates: Partial<PricingRule>,
    performedBy: string,
  ): Promise<void> {
    assertNoClientPeakSchedule(updates.peakHourMultipliers);
    if (updates.additionalFees !== undefined) {
      throw PricingError.validation(
        "Additional fee replacement is not supported by updateRule.",
      );
    }

    try {
      if (updates.isActive === true) {
        await this.invokeAdminPricingRpc<null>("activatePricingRule", {
          ruleId,
          performedBy,
        });
      }

      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.baseFare !== undefined) updateData.base_fare = updates.baseFare;
      if (updates.pricePerKm !== undefined) updateData.price_per_km = updates.pricePerKm;
      if (updates.pricePerMinute !== undefined) {
        updateData.price_per_minute = updates.pricePerMinute;
      }
      if (updates.minimumFare !== undefined) {
        updateData.minimum_fare = updates.minimumFare;
      }
      if (updates.maximumFare !== undefined) {
        updateData.maximum_fare = updates.maximumFare;
      }
      if (updates.isActive === false) updateData.is_active = false;
      if (updates.validFrom !== undefined) {
        updateData.valid_from = updates.validFrom?.toISOString();
      }
      if (updates.validUntil !== undefined) {
        updateData.valid_until = updates.validUntil?.toISOString();
      }
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      if (Object.keys(updateData).length > 0) {
        updateData.updated_by = performedBy;
        const { error } = await this.db
          .from<PricingRuleRow>("pricing_rules")
          .update(updateData)
          .eq("id", ruleId);
        if (error) throw error;
      }

      this.rulesCache.clear();
    } catch (error: unknown) {
      if (error instanceof PricingError) throw error;
      const parsed = providerError(error);
      logger.error("[PricingService] Error updating rule", parsed.message);
      if (
        parsed.code === "23514" ||
        parsed.hint.includes("validate_single_active_rule") ||
        parsed.message.toLowerCase().includes("conflito") ||
        parsed.message.includes("já existe regra ativa")
      ) {
        throw PricingError.conflict(
          "Já existe uma regra ativa para este modo no período especificado",
        );
      }
      throw new Error(parsed.message);
    }
  }

  async listRules(includeInactive = false): Promise<PricingRule[]> {
    try {
      let query = this.db
        .from<PricingRuleWithRelationsRow>("pricing_rules")
        .select(`
          *,
          peak_hour_multipliers:pricing_peak_hour_multipliers(*),
          additional_fees:pricing_additional_fees(*)
        `)
        .order("created_at", { ascending: false });

      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item) =>
        this.mapToRule(
          item,
          item.peak_hour_multipliers || [],
          item.additional_fees || [],
        )
      );
    } catch (error) {
      logger.error("[PricingService] Error listing pricing rules", error);
      throw error;
    }
  }

  async createRule(
    rule: Omit<PricingRule, "id">,
    performedBy: string,
  ): Promise<string> {
    assertNoClientPeakSchedule(rule.peakHourMultipliers);

    try {
      let ruleId: string;

      if (rule.isActive) {
        const created = await this.invokeAdminPricingRpc<string>(
          "createActivePricingRule",
          {
            mode: rule.mode,
            name: rule.name,
            baseFare: rule.baseFare,
            pricePerKm: rule.pricePerKm,
            pricePerMinute: rule.pricePerMinute,
            minimumFare: rule.minimumFare,
            maximumFare: rule.maximumFare || null,
            validFrom: rule.validFrom?.toISOString() || null,
            validUntil: rule.validUntil?.toISOString() || null,
            metadata: rule.metadata ?? {},
            performedBy,
          },
        );
        if (!created) throw new Error("Erro ao criar regra");
        ruleId = created;
      } else {
        const ruleData: PricingRuleInsert = {
          mode: rule.mode,
          name: rule.name,
          base_fare: rule.baseFare,
          price_per_km: rule.pricePerKm,
          price_per_minute: rule.pricePerMinute,
          minimum_fare: rule.minimumFare,
          maximum_fare: rule.maximumFare,
          is_active: false,
          valid_from: rule.validFrom?.toISOString(),
          valid_until: rule.validUntil?.toISOString(),
          metadata: toJsonMetadata(rule.metadata),
          created_by: performedBy,
          updated_by: performedBy,
        };

        const { data, error } = await this.db
          .from<PricingRuleRow>("pricing_rules")
          .insert(ruleData)
          .select("id")
          .single();
        if (error) throw error;
        if (!data?.id) throw new Error("Pricing rule insert returned no id");
        ruleId = String(data.id);
      }

      if (rule.additionalFees?.length) {
        const fees: PricingAdditionalFeeInsert[] = rule.additionalFees.map(
          (fee) => ({
            rule_id: ruleId,
            label: fee.label,
            amount: fee.amount,
            fee_type: fee.type,
            reason: fee.reason,
          }),
        );
        const { error } = await this.db
          .from<PricingAdditionalFeeRow>("pricing_additional_fees")
          .insert(fees);
        if (error) throw error;
      }

      this.rulesCache.clear();
      return ruleId;
    } catch (error: unknown) {
      if (error instanceof PricingError) throw error;
      const parsed = providerError(error);
      logger.error("[PricingService] Error creating pricing rule", parsed.message);
      if (
        parsed.code === "23514" ||
        parsed.hint.includes("validate_single_active_rule") ||
        parsed.message.toLowerCase().includes("conflito") ||
        parsed.message.includes("já existe regra ativa")
      ) {
        throw PricingError.conflict(
          "Já existe uma regra ativa para este modo no período especificado",
        );
      }
      throw new Error(parsed.message);
    }
  }

  clearCache(): void {
    this.rulesCache.clear();
  }

  async getAuditLog(limit = 20): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.db
        .from<PricingAuditLogRow>("pricing_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("[PricingService] Error fetching audit log", error);
      trackError(error as Error, {
        component: "PricingService",
        action: "getAuditLog",
      });
      throw error;
    }
  }

  private mapToRule(
    data: PricingRuleRow | PricingRuleWithRelationsRow,
    multipliers: PricingPeakHourMultiplierRow[],
    fees: PricingAdditionalFeeRow[],
  ): PricingRule {
    const peakHourMultipliers: NonNullable<PricingRule["peakHourMultipliers"]> = {};
    for (const multiplier of multipliers) {
      if (multiplier.period_type === "morning") {
        peakHourMultipliers.morning = Number(multiplier.multiplier);
      } else if (multiplier.period_type === "afternoon") {
        peakHourMultipliers.afternoon = Number(multiplier.multiplier);
      } else if (multiplier.period_type === "night") {
        peakHourMultipliers.night = Number(multiplier.multiplier);
      }
    }

    const additionalFees: AdditionalFee[] = fees.map((fee) => ({
      id: String(fee.id ?? ""),
      label: String(fee.label ?? ""),
      amount: Number(fee.amount),
      type: String(fee.fee_type ?? "fixed") as "fixed" | "percentage",
      reason: String(fee.reason ?? ""),
    }));

    return {
      id: String(data.id ?? ""),
      mode: String(data.mode ?? "ride") as PricingMode,
      name: String(data.name ?? ""),
      baseFare: Number(data.base_fare),
      pricePerKm: Number(data.price_per_km),
      pricePerMinute: Number(data.price_per_minute),
      minimumFare: Number(data.minimum_fare),
      maximumFare:
        data.maximum_fare === null || data.maximum_fare === undefined
          ? undefined
          : Number(data.maximum_fare),
      peakHourMultipliers:
        Object.keys(peakHourMultipliers).length > 0
          ? peakHourMultipliers
          : undefined,
      additionalFees: additionalFees.length > 0 ? additionalFees : undefined,
      isActive: Boolean(data.is_active),
      validFrom: data.valid_from ? new Date(String(data.valid_from)) : undefined,
      validUntil: data.valid_until ? new Date(String(data.valid_until)) : undefined,
      metadata: toMetadataRecord(data.metadata),
    };
  }
}
