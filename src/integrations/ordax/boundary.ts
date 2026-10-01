export const ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA =
  "acheguese.ordax-first-party-integration/1";

export const ORDAX_PROVIDER_ID = "ordax" as const;
export const ORDAX_CLIENT_ID = "acheguese" as const;
export const ORDAX_AUDIENCE = "ordax:first-party:acheguese" as const;

export const ORDAX_READ_SCOPES = Object.freeze([
  "network.space.read",
  "network.directory.read",
  "network.communities.read",
  "network.messages.read",
] as const);

export const ORDAX_WRITE_SCOPES = Object.freeze([
  "network.groups.join",
  "network.messages.write",
  "product.acheguese.publish",
] as const);

export type OrdaxIntegrationScope =
  | (typeof ORDAX_READ_SCOPES)[number]
  | (typeof ORDAX_WRITE_SCOPES)[number];

export type OrdaxConnectionState =
  | "active"
  | "revoked"
  | "error";

export type OrdaxLinkedEntityKind =
  | "business"
  | "education-institution"
  | "territory";

export interface OrdaxSpaceLink {
  readonly schema: typeof ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA;
  readonly provider: typeof ORDAX_PROVIDER_ID;
  readonly clientId: typeof ORDAX_CLIENT_ID;
  readonly audience: typeof ORDAX_AUDIENCE;
  readonly connectionId: string;
  readonly achegueseOwnerUserId: string;
  readonly achegueseEntityKind: OrdaxLinkedEntityKind;
  readonly achegueseEntityId: string;
  readonly issuer: string;
  readonly subjectId: string;
  readonly spaceId: string;
  readonly scopes: readonly OrdaxIntegrationScope[];
  readonly state: OrdaxConnectionState;
  readonly linkedAt: string;
  readonly revokedAt: string | null;
}

export type OrdaxPublicationKind =
  | "notice.published"
  | "notice.updated"
  | "notice.revoked";

export interface OrdaxPublicationEnvelope {
  readonly schema: "acheguese.ordax-publication-event/1";
  readonly eventId: string;
  readonly revision: number;
  readonly kind: OrdaxPublicationKind;
  readonly publisherSpaceId: string;
  readonly connectionId: string;
  readonly target:
    | { readonly kind: "linked-entity"; readonly entityId: string }
    | { readonly kind: "linked-territory"; readonly territoryId: string };
  readonly occurredAt: string;
}

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/;

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireOpaqueId(value: unknown, label: string): string {
  if (typeof value !== "string" || !OPAQUE_ID.test(value)) {
    throw new TypeError(`${label} must be a bounded opaque id`);
  }
  return value;
}

function requireHttpsIssuer(value: unknown): string {
  if (typeof value !== "string" || value.length > 512) {
    throw new TypeError("OrdaX issuer must be a bounded HTTPS URL");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("OrdaX issuer must be a valid HTTPS URL");
  }
  if (
    parsed.protocol !== "https:"
    || parsed.username !== ""
    || parsed.password !== ""
    || parsed.search !== ""
    || parsed.hash !== ""
  ) {
    throw new TypeError("OrdaX issuer must be an HTTPS URL without credentials, query or fragment");
  }
  return value;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be an ISO timestamp`);
  }
  return value;
}

export function validateOrdaxSpaceLink(value: unknown): OrdaxSpaceLink {
  const input = requireRecord(value, "OrdaX Space link");

  if (input.schema !== ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA) {
    throw new TypeError("OrdaX Space link schema is incompatible");
  }
  if (input.provider !== ORDAX_PROVIDER_ID) {
    throw new TypeError("OrdaX Space link provider is incompatible");
  }
  if (input.clientId !== ORDAX_CLIENT_ID) {
    throw new TypeError("OrdaX Space link client is incompatible");
  }
  if (input.audience !== ORDAX_AUDIENCE) {
    throw new TypeError("OrdaX Space link audience is incompatible");
  }

  const entityKinds: readonly OrdaxLinkedEntityKind[] = [
    "business",
    "education-institution",
    "territory",
  ];
  if (
    typeof input.achegueseEntityKind !== "string"
    || !entityKinds.includes(input.achegueseEntityKind as OrdaxLinkedEntityKind)
  ) {
    throw new TypeError("OrdaX Space link entity kind is invalid");
  }

  const issuer = requireHttpsIssuer(input.issuer);

  const states: readonly OrdaxConnectionState[] = ["active", "revoked", "error"];
  if (
    typeof input.state !== "string"
    || !states.includes(input.state as OrdaxConnectionState)
  ) {
    throw new TypeError("OrdaX Space link state is invalid");
  }

  if (!Array.isArray(input.scopes) || input.scopes.length > 16) {
    throw new TypeError("OrdaX scopes must be a bounded array");
  }

  const allowedScopes = new Set<OrdaxIntegrationScope>([
    ...ORDAX_READ_SCOPES,
    ...ORDAX_WRITE_SCOPES,
  ]);
  const scopes = input.scopes.map((scope) => {
    if (typeof scope !== "string" || !allowedScopes.has(scope as OrdaxIntegrationScope)) {
      throw new TypeError("OrdaX scope is unsupported");
    }
    return scope as OrdaxIntegrationScope;
  });
  if (new Set(scopes).size !== scopes.length) {
    throw new TypeError("OrdaX scopes must be unique");
  }

  const state = input.state as OrdaxConnectionState;
  const revokedAt =
    input.revokedAt === null
      ? null
      : requireIsoTimestamp(input.revokedAt, "OrdaX revokedAt");
  if (state === "revoked" && revokedAt === null) {
    throw new TypeError("Revoked OrdaX links require revokedAt");
  }
  if (state === "active" && revokedAt !== null) {
    throw new TypeError("Active OrdaX links cannot have revokedAt");
  }

  return Object.freeze({
    schema: ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA,
    provider: ORDAX_PROVIDER_ID,
    clientId: ORDAX_CLIENT_ID,
    audience: ORDAX_AUDIENCE,
    connectionId: requireOpaqueId(input.connectionId, "OrdaX connectionId"),
    achegueseOwnerUserId: requireOpaqueId(
      input.achegueseOwnerUserId,
      "Achegue-se owner user id",
    ),
    achegueseEntityKind: input.achegueseEntityKind as OrdaxLinkedEntityKind,
    achegueseEntityId: requireOpaqueId(
      input.achegueseEntityId,
      "Achegue-se entity id",
    ),
    issuer,
    subjectId: requireOpaqueId(input.subjectId, "OrdaX subjectId"),
    spaceId: requireOpaqueId(input.spaceId, "OrdaX spaceId"),
    scopes: Object.freeze(scopes),
    state,
    linkedAt: requireIsoTimestamp(input.linkedAt, "OrdaX linkedAt"),
    revokedAt,
  });
}

export function validateOrdaxPublicationEnvelope(
  value: unknown,
): OrdaxPublicationEnvelope {
  const input = requireRecord(value, "OrdaX publication envelope");

  if (input.schema !== "acheguese.ordax-publication-event/1") {
    throw new TypeError("OrdaX publication schema is incompatible");
  }

  const kinds: readonly OrdaxPublicationKind[] = [
    "notice.published",
    "notice.updated",
    "notice.revoked",
  ];
  if (typeof input.kind !== "string" || !kinds.includes(input.kind as OrdaxPublicationKind)) {
    throw new TypeError("OrdaX publication kind is invalid");
  }
  if (!Number.isSafeInteger(input.revision) || Number(input.revision) < 1) {
    throw new TypeError("OrdaX publication revision must be a positive integer");
  }

  const target = requireRecord(input.target, "OrdaX publication target");
  let normalizedTarget: OrdaxPublicationEnvelope["target"];
  if (target.kind === "linked-entity") {
    normalizedTarget = Object.freeze({
      kind: "linked-entity",
      entityId: requireOpaqueId(target.entityId, "Achegue-se linked entity id"),
    });
  } else if (target.kind === "linked-territory") {
    normalizedTarget = Object.freeze({
      kind: "linked-territory",
      territoryId: requireOpaqueId(target.territoryId, "Achegue-se territory id"),
    });
  } else {
    throw new TypeError("OrdaX publication target kind is invalid");
  }

  return Object.freeze({
    schema: "acheguese.ordax-publication-event/1",
    eventId: requireOpaqueId(input.eventId, "OrdaX eventId"),
    revision: Number(input.revision),
    kind: input.kind as OrdaxPublicationKind,
    publisherSpaceId: requireOpaqueId(
      input.publisherSpaceId,
      "OrdaX publisher Space id",
    ),
    connectionId: requireOpaqueId(input.connectionId, "OrdaX connection id"),
    target: normalizedTarget,
    occurredAt: requireIsoTimestamp(input.occurredAt, "OrdaX occurredAt"),
  });
}
