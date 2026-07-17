import { supabase } from "@/integrations/supabase";

export const COMMUNITY_RPC_OBSERVABILITY_WINDOWS = [5, 15, 60] as const;

export type CommunityRpcObservabilityWindow =
  (typeof COMMUNITY_RPC_OBSERVABILITY_WINDOWS)[number];

export type CommunityRpcSloState = "healthy" | "alert" | "insufficient_data";

export interface CommunityRpcMinuteMetric {
  action: string;
  bucketStartedAt: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercent: number;
  averageDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  maximumDurationMs: number;
}

export interface CommunityRpcSloStatus {
  action: string;
  totalRequests: number;
  errorRatePercent: number;
  p95DurationMs: number;
  status: CommunityRpcSloState;
  reasons: string[];
}

export interface CommunityRpcOperationsSnapshot {
  windowMinutes: CommunityRpcObservabilityWindow;
  metrics: CommunityRpcMinuteMetric[];
  sloStatuses: CommunityRpcSloStatus[];
}

function finiteNumber(value: number | null, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Contrato operacional invalido: ${field}.`);
  }
  return value;
}

function requiredText(value: string | null, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Contrato operacional invalido: ${field}.`);
  }
  return value;
}

function asSloState(value: string): CommunityRpcSloState {
  if (value === "healthy" || value === "alert" || value === "insufficient_data") {
    return value;
  }
  throw new Error("Contrato operacional invalido: status de SLO.");
}

class CommunityRpcOperationsServiceClass {
  async getSnapshot(
    windowMinutes: CommunityRpcObservabilityWindow,
  ): Promise<CommunityRpcOperationsSnapshot> {
    const [metricsResult, sloResult] = await Promise.all([
      supabase.rpc("get_community_rpc_operational_metrics", {
        p_since_minutes: windowMinutes,
      }),
      supabase.rpc("get_community_rpc_slo_status", {
        p_window_minutes: windowMinutes,
      }),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (sloResult.error) throw sloResult.error;

    const metrics = (metricsResult.data ?? []).map((row): CommunityRpcMinuteMetric => ({
      action: requiredText(row.action, "action"),
      bucketStartedAt: requiredText(row.bucket_started_at, "bucket_started_at"),
      totalRequests: finiteNumber(row.total_requests, "total_requests"),
      successfulRequests: finiteNumber(row.successful_requests, "successful_requests"),
      failedRequests: finiteNumber(row.failed_requests, "failed_requests"),
      errorRatePercent: finiteNumber(row.error_rate_percent, "error_rate_percent"),
      averageDurationMs: finiteNumber(row.average_duration_ms, "average_duration_ms"),
      p50DurationMs: finiteNumber(row.p50_duration_ms, "p50_duration_ms"),
      p95DurationMs: finiteNumber(row.p95_duration_ms, "p95_duration_ms"),
      p99DurationMs: finiteNumber(row.p99_duration_ms, "p99_duration_ms"),
      maximumDurationMs: finiteNumber(row.maximum_duration_ms, "maximum_duration_ms"),
    }));

    const sloStatuses = (sloResult.data ?? []).map((row): CommunityRpcSloStatus => ({
      action: requiredText(row.action, "action"),
      totalRequests: finiteNumber(row.total_requests, "total_requests"),
      errorRatePercent: finiteNumber(row.error_rate_percent, "error_rate_percent"),
      p95DurationMs: finiteNumber(row.p95_duration_ms, "p95_duration_ms"),
      status: asSloState(row.status),
      reasons: Array.isArray(row.reasons)
        ? row.reasons.filter((reason): reason is string => typeof reason === "string")
        : [],
    }));

    return {
      windowMinutes,
      metrics,
      sloStatuses,
    };
  }
}

export const communityRpcOperationsService = new CommunityRpcOperationsServiceClass();
