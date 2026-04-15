export type UserIdContext =
  | "authentication"
  | "global-settings"
  | "technical-operations"
  | "audit-logs"
  | "user-profile-relationship";

export type ProfileIdContext =
  | "posts"
  | "comments"
  | "messages"
  | "business-creation"
  | "social-interactions"
  | "domain-actions"
  | "contextual-moderation";

export type ProhibitedIdentifier =
  | "author_profile_id"
  | "authorProfileId"
  | "owner_profile_id"
  | "ownerProfileId"
  | "creator_profile_id"
  | "creatorProfileId"
  | "driver_profile_id"
  | "driverProfileId"
  | "sender_profile_id"
  | "senderProfileId"
  | "recipient_profile_id"
  | "recipientProfileId"
  | "moderator_profile_id"
  | "moderatorProfileId"
  | "reviewer_profile_id"
  | "reviewerProfileId";

export type QualifiedIdentifier =
  | "author_profile_id"
  | "authorProfileId"
  | "owner_profile_id"
  | "ownerProfileId"
  | "creator_profile_id"
  | "creatorProfileId"
  | "driver_profile_id"
  | "driverProfileId"
  | "sender_profile_id"
  | "senderProfileId"
  | "recipient_profile_id"
  | "recipientProfileId"
  | "moderator_profile_id"
  | "moderatorProfileId"
  | "reviewer_profile_id"
  | "reviewerProfileId";
