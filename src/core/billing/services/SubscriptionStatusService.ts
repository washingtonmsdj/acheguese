type SubscriptionShape = {
  status_v2?: string | null;
  status?: string | null;
  plan_code?: string | null;
  cancel_at_period_end?: boolean | null;
};

export class SubscriptionStatusService {
  static getStatus(subscription: SubscriptionShape | null | undefined): string {
    if (!subscription) return "inactive";
    if (typeof subscription.status_v2 === "string") return subscription.status_v2;
    if (typeof subscription.status === "string") return subscription.status;
    return "inactive";
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
    return Boolean(
      subscription &&
        (this.getStatus(subscription) === "canceled" ||
          subscription.cancel_at_period_end === true),
    );
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
