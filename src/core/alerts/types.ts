export type AlertType =
  | "crime"
  | "accident"
  | "fire"
  | "flood"
  | "power_outage"
  | "water_outage"
  | "road_closure"
  | "other";

export type AlertStatus = "active" | "resolved" | "expired";

export interface Alert {
  id: string;
  profile_id: string;
  type: AlertType;
  title: string;
  description: string;
  city: string;
  neighborhood?: string;
  street?: string;
  status: AlertStatus;
  confirmations_count: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertData {
  type: AlertType;
  title: string;
  description: string;
  city: string;
  neighborhood?: string;
  street?: string;
}

export class AlertError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "AlertError";
  }
}
