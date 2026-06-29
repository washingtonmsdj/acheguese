import { supabase } from "@/integrations/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import {
  ADMIN_SUBSCRIPTION_STATUS,
  type AdminSubscriptionStatus,
} from "@/core/admin/config/subscription-status";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminSubscriptionsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminSubscriptionsDbClient;

const PLAN_TYPES = ["free", "basic", "premium", "enterprise"] as const;

type PlanType = (typeof PLAN_TYPES)[number];
type UserSubscriptionRow = Tables<"user_subscriptions">;
type UserSubscriptionInsert = TablesInsert<"user_subscriptions">;
type UserSubscriptionUpdate = TablesUpdate<"user_subscriptions">;

type UserSummary = {
  id: string;
  email: string | null;
};

type SubscriptionRowWithUser = UserSubscriptionRow & {
  user?: UserSummary | readonly UserSummary[] | null;
};

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
  plan_type: PlanType;
  status: AdminSubscriptionStatus;
  active: boolean;
  amount_cents: number;
  started_at: string;
  expires_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionListItem extends Subscription {
  user: UserSummary | null;
}

function incrementCounter(counter: Map<string, number>, key: string, amount: number): void {
  counter.set(key, (counter.get(key) ?? 0) + amount);
}

function isPlanType(value: string): value is PlanType {
  return (PLAN_TYPES as readonly string[]).includes(value);
}

function normalizePlanType(value: string): PlanType {
  return isPlanType(value) ? value : "free";
}

function normalizeSubscriptionStatus(value: string): AdminSubscriptionStatus {
  switch (value) {
    case ADMIN_SUBSCRIPTION_STATUS.ACTIVE:
    case ADMIN_SUBSCRIPTION_STATUS.EXPIRED:
    case ADMIN_SUBSCRIPTION_STATUS.CANCELLED:
    case ADMIN_SUBSCRIPTION_STATUS.PENDING:
      return value;
    default:
      return ADMIN_SUBSCRIPTION_STATUS.PENDING;
  }
}

function normalizeUserRelation(
  user: SubscriptionRowWithUser["user"],
): UserSummary | null {
  if (isUserSummaryArray(user)) {
    return user[0] ?? null;
  }
  return user ?? null;
}

function isUserSummaryArray(
  value: SubscriptionRowWithUser["user"],
): value is readonly UserSummary[] {
  return Array.isArray(value);
}

function mapSubscription(row: UserSubscriptionRow): Subscription {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_type: normalizePlanType(row.plan_type),
    status: normalizeSubscriptionStatus(row.status),
    active: row.active,
    amount_cents:
      typeof row.amount_cents === "number"
        ? row.amount_cents
        : typeof row.price_cents === "number"
          ? row.price_cents
          : 0,
    started_at: row.started_at,
    expires_at: row.expires_at,
    cancelled_at: row.canceled_at,
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

function toUserSubscriptionInsert(data: Partial<Subscription>): Partial<UserSubscriptionInsert> {
  const payload: Partial<UserSubscriptionInsert> = {};

  if (data.user_id !== undefined) payload.user_id = data.user_id;
  if (data.plan_type !== undefined) payload.plan_type = data.plan_type;
  if (data.status !== undefined) payload.status = data.status;
  if (data.active !== undefined) payload.active = data.active;
  if (data.amount_cents !== undefined) payload.amount_cents = data.amount_cents;
  if (data.started_at !== undefined) payload.started_at = data.started_at;
  if (data.expires_at !== undefined) payload.expires_at = data.expires_at;
  if (data.cancelled_at !== undefined) payload.canceled_at = data.cancelled_at;
  if (data.created_at !== undefined) payload.created_at = data.created_at;
  if (data.updated_at !== undefined) payload.updated_at = data.updated_at;

  return payload;
}

function toUserSubscriptionUpdate(data: Partial<Subscription>): Partial<UserSubscriptionUpdate> {
  return toUserSubscriptionInsert(data);
}

class AdminSubscriptionsServiceClass {
  async getStats(): Promise<SubscriptionStats> {
    try {
      const { data, error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .select("*");

      if (error) throw error;

      const subscriptions = data ?? [];
      const now = new Date();
      const stats: SubscriptionStats = {
        total: subscriptions.length,
        active: subscriptions.filter(
          (subscription) =>
            subscription.active &&
            normalizeSubscriptionStatus(subscription.status) ===
              ADMIN_SUBSCRIPTION_STATUS.ACTIVE,
        ).length,
        expired: subscriptions.filter(
          (subscription) =>
            normalizeSubscriptionStatus(subscription.status) ===
            ADMIN_SUBSCRIPTION_STATUS.EXPIRED,
        ).length,
        cancelled: subscriptions.filter(
          (subscription) =>
            normalizeSubscriptionStatus(subscription.status) ===
            ADMIN_SUBSCRIPTION_STATUS.CANCELLED,
        ).length,
        byPlan: {},
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageLifetime: 0,
      };

      const byPlanCounter = new Map<string, number>();
      for (const subscription of subscriptions) {
        incrementCounter(byPlanCounter, normalizePlanType(subscription.plan_type), 1);

        const amount = subscription.amount_cents / 100;
        stats.totalRevenue += amount;
        if (
          subscription.active &&
          normalizeSubscriptionStatus(subscription.status) ===
            ADMIN_SUBSCRIPTION_STATUS.ACTIVE
        ) {
          stats.monthlyRecurringRevenue += amount;
        }
      }
      stats.byPlan = Object.fromEntries(byPlanCounter.entries());

      const lifetimes = subscriptions
        .filter((subscription) => Boolean(subscription.started_at))
        .map((subscription) => {
          const start = new Date(subscription.started_at);
          const end = subscription.canceled_at ? new Date(subscription.canceled_at) : now;
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
    planType?: string;
    status?: string;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, planType, status } = params;

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
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }

      if (planType) {
        query = query.eq("plan_type", planType);
      }

      if (status) {
        query = query.eq("status", status);
      }

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

  async createSubscription(data: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const payload = toUserSubscriptionInsert(data);
      const { data: subscription, error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;
      return subscription ? mapSubscription(subscription) : null;
    } catch (error) {
      logger.error("AdminSubscriptionsService.createSubscription", error as Error, data);
      return null;
    }
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<boolean> {
    try {
      const payload = toUserSubscriptionUpdate(data);
      if (Object.keys(payload).length === 0) return true;

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.updateSubscription", error as Error, { id, data });
      return false;
    }
  }

  async cancelSubscription(subscriptionId: string, _reason?: string): Promise<boolean> {
    try {
      const patch: Partial<UserSubscriptionUpdate> = {
        status: ADMIN_SUBSCRIPTION_STATUS.CANCELLED,
        active: false,
        canceled_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(patch)
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.cancelSubscription", error as Error, {
        subscriptionId,
      });
      return false;
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const patch: Partial<UserSubscriptionUpdate> = {
        status: ADMIN_SUBSCRIPTION_STATUS.ACTIVE,
        active: true,
        canceled_at: null,
      };

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(patch)
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.reactivateSubscription", error as Error, {
        subscriptionId,
      });
      return false;
    }
  }

  async renewSubscription(subscriptionId: string, days = 30): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const patch: Partial<UserSubscriptionUpdate> = {
        status: ADMIN_SUBSCRIPTION_STATUS.ACTIVE,
        active: true,
        canceled_at: null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(patch)
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.renewSubscription", error as Error, {
        subscriptionId,
        days,
      });
      return false;
    }
  }

  async getExpiringSubscriptions(daysAhead = 7): Promise<SubscriptionListItem[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await db.from<SubscriptionRowWithUser>("user_subscriptions").select(
        `
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `,
      )
        .eq("active", true)
        .eq("status", ADMIN_SUBSCRIPTION_STATUS.ACTIVE)
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

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
        .from<Pick<UserSubscriptionRow, "amount_cents" | "created_at" | "plan_type">>(
          "user_subscriptions",
        )
        .select("amount_cents, created_at, plan_type")
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

      for (const subscription of data ?? []) {
        const amount = subscription.amount_cents / 100;
        revenue.total += amount;
        incrementCounter(byPlanCounter, normalizePlanType(subscription.plan_type), amount);

        const month = new Date(subscription.created_at).toISOString().slice(0, 7);
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
        .from<Pick<UserSubscriptionRow, "status" | "canceled_at">>("user_subscriptions")
        .select("status, canceled_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const subscriptions = data ?? [];
      const total = subscriptions.length;
      const cancelled = subscriptions.filter(
        (subscription) =>
          normalizeSubscriptionStatus(subscription.status) ===
          ADMIN_SUBSCRIPTION_STATUS.CANCELLED,
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

  async upgradePlan(subscriptionId: string, newPlan: string, newAmount: number): Promise<boolean> {
    try {
      const patch: Partial<UserSubscriptionUpdate> = {
        plan_type: newPlan,
        amount_cents: newAmount,
      };

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(patch)
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.upgradePlan", error as Error, {
        subscriptionId,
        newPlan,
        newAmount,
      });
      return false;
    }
  }

  async downgradePlan(
    subscriptionId: string,
    newPlan: string,
    newAmount: number,
  ): Promise<boolean> {
    try {
      const patch: Partial<UserSubscriptionUpdate> = {
        plan_type: newPlan,
        amount_cents: newAmount,
      };

      const { error } = await db
        .from<UserSubscriptionRow>("user_subscriptions")
        .update(patch)
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminSubscriptionsService.downgradePlan", error as Error, {
        subscriptionId,
        newPlan,
        newAmount,
      });
      return false;
    }
  }
}

export const adminSubscriptionsService = new AdminSubscriptionsServiceClass();
