export const FAMILY_TABLES = {
  connections: "family_connections",
  locations: "family_locations",
  locationSharingSettings: "family_location_sharing_settings",
  geofences: "family_geofences",
  alerts: "family_location_alerts",
} as const;

export type FamilyTableName = (typeof FAMILY_TABLES)[keyof typeof FAMILY_TABLES];

export type FamilyConnectionStatus = "pending" | "active" | "rejected";
export const FAMILY_CONNECTION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;

export type FamilyRelationshipType = "pai" | "mae" | "responsavel" | "tutor";

export interface FamilyProfileSummary {
  name: string;
  avatar_url: string | null;
}

export interface FamilyConnection {
  id: string;
  parent_id: string;
  child_id: string | null;
  parent_profile_id?: string | null;
  child_profile_id?: string | null;
  status: FamilyConnectionStatus | string;
  created_at: string;
  updated_at?: string;
  responded_at?: string | null;
  child_email?: string | null;
  child_name?: string;
  parent_name?: string;
  child_profile?: FamilyProfileSummary | null;
  parent_profile?: FamilyProfileSummary | null;
  relationship_type?: FamilyRelationshipType | string;
}

export interface FamilyLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  profile_id?: string | null;
  user_id?: string | null;
  updated_at?: string;
  battery_level?: number | null;
}

export interface FamilyLocationSharingSettings {
  id?: string;
  user_id?: string | null;
  profile_id?: string | null;
  enabled: boolean;
  update_frequency: number;
  battery_saver_mode?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyGeofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  radius_meters?: number;
  is_active: boolean;
  icon?: string | null;
  profile_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyLocationAlert {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read?: boolean;
  read_at?: string | null;
  profile_id?: string | null;
  user_id?: string | null;
  connection_id?: string | null;
  geofence_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SendFamilyInviteInput {
  childEmail: string;
  relationshipType: FamilyRelationshipType;
}

export interface FamilyCoverageSummary {
  activeChildrenCount: number;
  activeParentsCount: number;
  pendingInvitesCount: number;
  relationshipTypes: string[];
}
