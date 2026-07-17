export const AUDIT_DATA_CLASSES = [
  "metadata_only",
  "pseudonymous",
  "restricted",
] as const;

export const AUDIT_RETENTION_CLASSES = [
  "operational",
  "security",
  "moderation",
  "legal_hold",
] as const;

export type AuditDataClass = (typeof AUDIT_DATA_CLASSES)[number];
export type AuditRetentionClass = (typeof AUDIT_RETENTION_CLASSES)[number];
export type AuditMetadataValue = string | number | boolean | null;
export type AuditMetadata = Readonly<Record<string, AuditMetadataValue>>;

export interface AuditActor {
  userId: string | null;
  profileId: string | null;
}

export interface AuditTarget {
  type: string;
  id: string;
}

export interface AuditEvent {
  id: string;
  source: string;
  actor: AuditActor;
  action: string;
  target: AuditTarget;
  territoryId: string | null;
  metadata: AuditMetadata;
  dataClass: AuditDataClass;
  retentionClass: AuditRetentionClass;
  occurredAt: string;
}

export interface AuditEventDraft extends Omit<AuditEvent, "id" | "occurredAt"> {
  occurredAt?: string;
}

export interface AuditCursor {
  occurredAt: string;
  eventId: string;
}

export interface AuditPage {
  items: AuditEvent[];
  nextCursor: AuditCursor | null;
}

export interface AuditReadRequest {
  cursor?: AuditCursor | null;
  limit?: number;
}

/** Browser readers expose bounded, authorized metadata views only. */
export interface AuditEventReader {
  readPage(request?: AuditReadRequest): Promise<AuditPage>;
}

/** Backend-only append port. Mutation and deletion are intentionally absent. */
export interface AuditEventSink {
  append(event: AuditEventDraft): Promise<AuditEvent>;
}
