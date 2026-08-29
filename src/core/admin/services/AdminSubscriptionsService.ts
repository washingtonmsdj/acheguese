import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
};

type AdminSubscriptionsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminSubscriptionsDbClient;

type UserSubscriptionRow = Tables<"user_subscriptions">;

type UserSummary = {
  id: string;
  email: string | null;
};

type SubscriptionRowWithUser = UserSubscriptionRow & {
  user?: UserSummary | readonly UserSummary[] | null;
};

export type AdminSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "canceled";

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  byPlan: Record<string, number>;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageLifetime: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: string;
  status: AdminSubscriptionStatus;
  active: boolean;
  amount_cents: number;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionListItem extends Subscription {
  user: UserSummary | null;
}

const CANONICAL_STATUSES = new Set<AdminSubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "canceled",
]);

function incrementCounter(counter: Map<string, number>, key: string, amount: number): void {
  counter.set(key, (counter.get(key) ?? 0) + amount);
}

function normalizeSubscriptionStatus(
  value: string | null | undefined,
): AdminSubscriptionStatus {
  if (value === "cancelled") return "canceled";
  if (value === "expired") return "incomplete_expired";
  if (value === "pending") return "incomplete";
  if (CANONICAL_STATUSES.has(value as AdminSubscriptionStatus)) {
    return value as AdminSubscriptionStatus;
  }
  return "incomplete";
}

function normalizeUserRelation(
  user: SubscriptionRowWithUser["user"],
): UserSummary | null {
  if (Array.isArray(user)) {
    return user[0] ?? null;
  }
  return (user as UserSummary | null | undefined) ?? null;
}

function subscriptionPlanCode(row: UserSubscriptionRow): string {
  return row.plan_code ?? row.plan_type ?? "free";
}

function subscriptionAmountCents(row: UserSubscriptionRow): number {
  if (typeof row.price_cents === "number") return row.price_cents;
  if (typeof row.amount_cents === "number") return row.amount_cents;
  return 0;
}

function mapSubscription(row: UserSubscriptionRow): Subscription {
  const status = normalizeSubscriptionStatus(row.status_v2 ?? row.status);

  return {
    id: row.id,
    user_id: row.user_id,
    plan_code: subscriptionPlanCode(row),
    status,
    active: status === "active" || status === "trialing",
    amount_cents: subscriptionAmountCents(row),
    started_at: row.current_period_start ?? row.started_at ?? row.created_at,
    expires_at: row.current_period_end ?? row.expires_at ?? null,
    cancelled_at: row.canceled_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSubscriptionListItem(row: SubscriptionRowWithUser): SubscriptionListItem {
  return {
    ...mapSubscription(row),
    user: normalizeUserRelation(row.user),
  };
}

/**
 * Read model administrativo de billing.
 *
 * Não possui autoridade de escrita sobre user_subscriptions. Mudanças comerciais
 * devem acontecer via Stripe Checkout/Customer Portal e ser materializadas pelo
 * webhook server-side do core billing.
 */
class AdminSubscriptionsServiceClass {
  async getStats(): Promise<SubscriptionStats> {
    try {
      const { data, error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .select("*");

      if (error) throw error;

      const subscriptions = (data ?? []).map(mapSubscription);
      const now = new Date();
      const stats: SubscriptionStats = {
        total: subscriptions.length,
        active: subscriptions.filter((subscription) => subscription.active).length,
        expired: subscriptions.filter(
          (subscription) => subscription.status === "incomplete_expired",
        ).length,
        cancelled: subscriptions.filter(
          (subscription) => subscription.status === "canceled",
        ).length,
        byPlan: {},
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageLifetime: 0,
      };

      const byPlanCounter = new Map<string, number>();
      for (const subscription of subscriptions) {
        incrementCounter(byPlanCounter, subscription.plan_code, 1);

        const amount = subscription.amount_cents / 100;
        stats.totalRevenue += amount;
        if (subscription.active) {
          stats.monthlyRecurringRevenue += amount;
        }
      }
      stats.byPlan = Object.fromEntries(byPlanCounter.entries());

      const lifetimes = subscriptions.map((subscription) => {
        const start = new Date(subscription.started_at);
        const end = subscription.cancelled_at
          ? new Date(subscription.cancelled_at)
          : now;
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      });

      stats.averageLifetime =
        lifetimes.length > 0
          ? lifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / lifetimes.length
          : 0;

      return stats;
    } catch (error) {
      logger.error("AdminSubscriptionsService.getStats", error as Error);
      throw error;
    }
  }

  async getAllSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    planCode?: string;
    status?: string;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, planCode, status } = params;

      let query = db.from<SubscriptionRowWithUser>("user_subscriptions").select(
        `
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `,
        { count: "exact" },
      );

      if (search) {
        const searchFilter = buildSafeOrILikeFilter(["user.email"], search);
        if (searchFilter) query = query.or(searchFilter);
      }

      if (planCode) query = query.eq("plan_code", planCode);
      if (status) query = query.eq("status_v2", status);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data ?? []).map(mapSubscriptionListItem),
        count: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    } catch (error) {
      logger.error("AdminSubscriptionsService.getAllSubscriptions", error as Error, params);
      throw error;
    }
  }

  async getExpiringSubscriptions(daysAhead = 7): Promise<SubscriptionListItem[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await db
        .from<SubscriptionRowWithUser>("user_subscriptions")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `)
        .eq("status_v2", "active")
        .not("current_period_end", "is", null)
        .gte("current_period_end", now.toISOString())
        .lte("current_period_end", futureDate.toISOString())
        .order("current_period_end", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapSubscriptionListItem);
    } catch (error) {
      logger.error("AdminSubscriptionsService.getExpiringSubscriptions", error as Error, {
        daysAhead,
      });
      return [];
    }
  }

  async getRevenueByPeriod(startDate: string, endDate: string) {
    try {
      const { data, error } = await db
        .from<
          Pick<
            UserSubscriptionRow,
            "price_cents" | "amount_cents" | "created_at" | "plan_code" | "plan_type"
          >
        >("user_subscriptions")
        .select("price_cents, amount_cents, created_at, plan_code, plan_type")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const revenue = {
        total: 0,
        byPlan: {} as Record<string, number>,
        byMonth: {} as Record<string, number>,
      };
      const byPlanCounter = new Map<string, number>();
      const byMonthCounter = new Map<string, number>();

      for (const row of data ?? []) {
        const amountCents =
          typeof row.price_cents === "number"
            ? row.price_cents
            : typeof row.amount_cents === "number"
              ? row.amount_cents
              : 0;
        const amount = amountCents / 100;
        const planCode = row.plan_code ?? row.plan_type ?? "free";

        revenue.total += amount;
        incrementCounter(byPlanCounter, planCode, amount);

        const month = new Date(row.created_at).toISOString().slice(0, 7);
        incrementCounter(byMonthCounter, month, amount);
      }

      revenue.byPlan = Object.fromEntries(byPlanCounter.entries());
      revenue.byMonth = Object.fromEntries(byMonthCounter.entries());
      return revenue;
    } catch (error) {
      logger.error("AdminSubscriptionsService.getRevenueByPeriod", error as Error, {
        startDate,
        endDate,
      });
      return { total: 0, byPlan: {}, byMonth: {} };
    }
  }

  async getChurnRate(months = 3) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await db
        .from<Pick<UserSubscriptionRow, "status_v2" | "status" | "canceled_at">>(
          "user_subscriptions",
        )
        .select("status_v2, status, canceled_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const subscriptions = data ?? [];
      const total = subscriptions.length;
      const cancelled = subscriptions.filter(
        (subscription) =>
          normalizeSubscriptionStatus(subscription.status_v2 ?? subscription.status) ===
          "canceled",
      ).length;

      return {
        churnRate: total > 0 ? (cancelled / total) * 100 : 0,
        totalSubscriptions: total,
        cancelledSubscriptions: cancelled,
      };
    } catch (error) {
      logger.error("AdminSubscriptionsService.getChurnRate", error as Error, { months });
      return { churnRate: 0, totalSubscriptions: 0, cancelledSubscriptions: 0 };
    }
  }
}

export const adminSubscriptionsService = new AdminSubscriptionsServiceClass();
