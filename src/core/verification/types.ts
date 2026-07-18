export const VERIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVOKED: "revoked",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_TYPE = {
  EMAIL: "email",
  PHONE: "phone",
  DOCUMENT: "document",
  RESIDENT: "resident",
  BUSINESS: "business",
} as const;

export type VerificationType =
  (typeof VERIFICATION_TYPE)[keyof typeof VERIFICATION_TYPE];

export interface Verification {
  id: string;
  profile_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  document_url: string | null;
  document_type: string | null;
  notes: string | null;
  review_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequestResult {
  id: string;
  profile_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  submitted_at: string;
}

export interface VerificationReviewItem extends Verification {
  display_name: string;
  avatar_url: string | null;
}

export interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revoked: number;
}

export type VerificationDecision = "approve" | "reject" | "revoke";
