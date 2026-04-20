type SubscriptionShape = {
  status?: string | null;
  plan_code?: string | null;
  cancel_at_period_end?: boolean | null;
};

export class SubscriptionStatusService {
  static getStatus(subscription: SubscriptionShape | null | undefined): string {
    if (!subscription || typeof subscription.status !== "string") {
      return "inactive";
    }
    return subscription.status;
  }

  static isActive(status: string): boolean {
    return status === "active" || status === "trialing";
  }

  static isTrialing(status: string): boolean {
    return status === "trialing";
  }

  static isPastDue(status: string): boolean {
    return status === "past_due";
  }

  static isCanceled(subscription: SubscriptionShape | null | undefined): boolean {
    return Boolean(subscription && subscription.cancel_at_period_end === true);
  }

  static planCode(subscription: SubscriptionShape | null | undefined): string {
    if (!subscription || !subscription.plan_code) return "free";
    return subscription.plan_code;
  }

  static statusLabel(status: string): string {
    if (status === "trialing") return "Trial";
    return status;
  }
}

