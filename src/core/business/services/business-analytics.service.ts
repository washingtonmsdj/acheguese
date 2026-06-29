import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lt: (column: string, value: string | number) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
}

interface BusinessAnalyticsDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface BusinessViewRow {
  id: string;
  viewed_at?: string | null;
}

interface AnalyticsEventRow {
  id: string;
}

const analyticsDb = supabase as unknown as BusinessAnalyticsDbClient;

export type BusinessAnalyticsPeriod = "today" | "week" | "month" | "year";

export interface BusinessAnalyticsSummary {
  views: number;
  whatsappClicks: number;
  phoneClicks: number;
  routeClicks: number;
  appointments: number;
  favorites: number;
  shares: number;
  previous: {
    views: number;
    whatsappClicks: number;
    phoneClicks: number;
    routeClicks: number;
    appointments: number;
    favorites: number;
    shares: number;
  };
  hourlyViews: Array<{ hour: string; visits: number }>;
}

type AnalyticsCounter =
  | "whatsappClicks"
  | "phoneClicks"
  | "routeClicks"
  | "appointments"
  | "favorites"
  | "shares";

const EVENT_NAMES: Record<AnalyticsCounter, string[]> = {
  whatsappClicks: ["whatsapp_click", "business_whatsapp_click"],
  phoneClicks: ["phone_click", "business_phone_click"],
  routeClicks: ["route_click", "directions_click", "business_route_click"],
  appointments: ["appointment_created", "booking_created", "schedule_created"],
  favorites: ["business_favorite", "favorite_added"],
  shares: ["share", "business_share"],
};

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

async function countBusinessViews(
  businessId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const { count, error } = await analyticsDb
    .from<BusinessViewRow>("business_views")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("viewed_at", start.toISOString())
    .lt("viewed_at", end.toISOString());

  if (error) throw error;
  return count ?? 0;
}

async function countAnalyticsEvents(
  businessId: string,
  eventNames: string[],
  start: Date,
  end: Date,
): Promise<number> {
  const { count, error } = await analyticsDb
    .from<AnalyticsEventRow>("analytics_events")
    .select("id", { count: "exact", head: true })
    .in("event_name", eventNames)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .or(`metadata->>business_id.eq.${businessId},metadata->>businessId.eq.${businessId}`);

  if (error) throw error;
  return count ?? 0;
}

async function getHourlyViews(
  businessId: string,
  start: Date,
  end: Date,
): Promise<Array<{ hour: string; visits: number }>> {
  const { data, error } = await analyticsDb
    .from<BusinessViewRow>("business_views")
    .select("viewed_at")
    .eq("business_id", businessId)
    .gte("viewed_at", start.toISOString())
    .lt("viewed_at", end.toISOString());

  if (error) throw error;

  const hourly = new Map<string, number>();
  for (const row of data ?? []) {
    const viewedAt = typeof row.viewed_at === "string" ? row.viewed_at : null;
    if (!viewedAt) continue;

    const hour = `${new Date(viewedAt).getHours().toString().padStart(2, "0")}:00`;
    hourly.set(hour, (hourly.get(hour) ?? 0) + 1);
  }

  return [...hourly.entries()]
    .map(([hour, visits]) => ({ hour, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 4);
}

async function getCounters(
  businessId: string,
  start: Date,
  end: Date,
): Promise<Omit<BusinessAnalyticsSummary, "previous" | "hourlyViews">> {
  const [
    views,
    whatsappClicks,
    phoneClicks,
    routeClicks,
    appointments,
    favorites,
    shares,
  ] = await Promise.all([
    countBusinessViews(businessId, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.whatsappClicks, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.phoneClicks, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.routeClicks, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.appointments, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.favorites, start, end),
    countAnalyticsEvents(businessId, EVENT_NAMES.shares, start, end),
  ]);

  return {
    views,
    whatsappClicks,
    phoneClicks,
    routeClicks,
    appointments,
    favorites,
    shares,
  };
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
    const [current, previous, hourlyViews] = await Promise.all([
      getCounters(businessId, start, end),
      getCounters(businessId, previousStart, previousEnd),
      getHourlyViews(businessId, start, end),
    ]);

    return {
      ...current,
      previous,
      hourlyViews,
    };
  } catch (error) {
    logger.error("[business-analytics] Failed to load summary", error);
    throw error;
  }
}
