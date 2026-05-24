export type ResidentialLocalityStatus = "active" | "pending_review" | "inactive";

export const RESIDENTIAL_LOCALITY_STATUS = {
  ACTIVE: "active",
  PENDING_REVIEW: "pending_review",
  INACTIVE: "inactive",
} as const satisfies Record<string, ResidentialLocalityStatus>;
