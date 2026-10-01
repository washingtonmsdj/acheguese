export type OrdaxIntegrationState =
  | "not-connected"
  | "authorizing"
  | "connected"
  | "revoked"
  | "error";

export type OrdaxPermissionClass =
  | "space-profile"
  | "network-directory"
  | "network-membership"
  | "network-messaging-read"
  | "network-messaging-write";

export interface OrdaxSpaceLink {
  achegueseProfileId: string;
  ordaxSpaceId: string;
  ordaxSpaceName: string;
  permissions: readonly OrdaxPermissionClass[];
  state: Exclude<OrdaxIntegrationState, "not-connected" | "authorizing">;
  linkedAt: string;
  updatedAt: string;
}

export interface OrdaxConnectionStart {
  authorizationUrl: string;
  expiresAt: string;
}

export interface OrdaxConnectionRequest {
  achegueseProfileId: string;
  requestedPermissions: readonly OrdaxPermissionClass[];
}

export interface OrdaxIntegrationPort {
  getLink(achegueseProfileId: string): Promise<OrdaxSpaceLink | null>;

  beginConnection(
    request: OrdaxConnectionRequest,
  ): Promise<OrdaxConnectionStart>;

  disconnect(achegueseProfileId: string): Promise<void>;
}
