/**
 * Internal domain: delivery incidents.
 */

export const DELIVERY_OCCURRENCE_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved",
} as const;

export type DeliveryOccurrenceStatus =
  (typeof DELIVERY_OCCURRENCE_STATUS)[keyof typeof DELIVERY_OCCURRENCE_STATUS];

export const DELIVERY_OCCURRENCE_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type DeliveryOccurrenceSeverity =
  (typeof DELIVERY_OCCURRENCE_SEVERITY)[keyof typeof DELIVERY_OCCURRENCE_SEVERITY];

export const DELIVERY_OCCURRENCE_TYPE = {
  RECIPIENT_UNAVAILABLE: "recipient_unavailable",
  ADDRESS_ISSUE: "address_issue",
  TRAFFIC_DELAY: "traffic_delay",
  VEHICLE_ISSUE: "vehicle_issue",
  SAFETY_ISSUE: "safety_issue",
  PACKAGE_ISSUE: "package_issue",
  OTHER: "other",
} as const;

export type DeliveryOccurrenceType =
  (typeof DELIVERY_OCCURRENCE_TYPE)[keyof typeof DELIVERY_OCCURRENCE_TYPE];

export interface DeliveryOccurrence {
  id: string;
  order_id: string;
  occurrence_type: DeliveryOccurrenceType;
  severity: DeliveryOccurrenceSeverity;
  status: DeliveryOccurrenceStatus;
  description: string;
  reported_by_profile_id?: string | null;
  resolution_notes?: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}
