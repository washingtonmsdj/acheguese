import {
  AnalyticsService,
  type AnalyticsMetrics,
} from "@/core/analytics/AnalyticsService";
import { logger } from "@/shared/utils/logger";

export type BusinessAnalyticsPeriod = "today" | "week" | "month" | "year";

export interface BusinessAnalyticsSummary {
  views: number;
  whatsappClicks: number;
  phoneClicks: number;
  routeClicks: number;
  favorites: number;
  shares: number;
  previous: {
    views: number;
    whatsappClicks: number;
    phoneClicks: number;
    routeClicks: number;
    favorites: number;
    shares: number;
  };
}

type BusinessAnalyticsCounters = Omit<BusinessAnalyticsSummary, "previous">;

function getPeriodRange(period: BusinessAnalyticsPeriod, reference = new Date()) {
  const end = new Date(reference);
  const start = new Date(reference);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setDate(start.getDate() - 30);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }

  const previousEnd = new Date(start);
  const previousStart = new Date(start);
  previousStart.setTime(start.getTime() - (end.getTime() - start.getTime()));

  return { start, end, previousStart, previousEnd };
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function toBusinessCounters(metrics: AnalyticsMetrics | null): BusinessAnalyticsCounters {
  return {
    views: metrics?.total_views ?? 0,
    whatsappClicks: metrics?.clicks_whatsapp ?? 0,
    phoneClicks: metrics?.clicks_phone ?? 0,
    routeClicks: metrics?.clicks_directions ?? 0,
    favorites: metrics?.favorites_added ?? 0,
    shares: metrics?.shares ?? 0,
  };
}

async function getCounters(
  businessId: string,
  start: Date,
  end: Date,
): Promise<BusinessAnalyticsCounters> {
  const result = await AnalyticsService.getMetrics(
    "business",
    businessId,
    start.toISOString(),
    end.toISOString(),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return toBusinessCounters(result.data);
}

export function getMetricChange(
  current: number,
  previous: number,
): number {
  return percentChange(current, previous);
}

export async function getBusinessAnalyticsSummary(
  businessId: string,
  period: BusinessAnalyticsPeriod,
): Promise<BusinessAnalyticsSummary> {
  const { start, end, previousStart, previousEnd } = getPeriodRange(period);

  try {
    const [current, previous] = await Promise.all([
      getCounters(businessId, start, end),
      getCounters(businessId, previousStart, previousEnd),
    ]);

    return {
      ...current,
      previous,
    };
  } catch (error) {
    logger.error("[business-analytics] Failed to load canonical summary", error);
    throw error;
  }
}
