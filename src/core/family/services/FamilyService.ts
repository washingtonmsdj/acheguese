import { SessionService } from "@/core/session/services/SessionService";
import { supabase } from "@/integrations/supabase";
import type {
  FamilyConnection,
  FamilyCoverageSummary,
  FamilyGeofence,
  FamilyLocationAlert,
  FamilyLocationData,
  FamilyLocationSharingSettings,
  SendFamilyInviteInput,
} from "@/core/family/types";
import { FAMILY_CONNECTION_STATUS, FAMILY_TABLES } from "@/core/family/types";

const db = supabase as any;
const CONNECTION_SELECT = `
  id,
  parent_id,
  child_id,
  parent_profile_id,
  child_profile_id,
  child_email,
  relationship_type,
  status,
  created_at,
  updated_at,
  responded_at,
  parent_profile:profiles!family_connections_parent_profile_id_fkey(name, avatar_url),
  child_profile:profiles!family_connections_child_profile_id_fkey(name, avatar_url)
`;

function normalizeEmail(email: string | null | undefined): string | null {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizeGeofence(row: FamilyGeofence): FamilyGeofence {
  const radiusMeters = row.radius_meters ?? row.radius;

  return {
    ...row,
    radius: radiusMeters,
    radius_meters: radiusMeters,
  };
}

function mapGeofenceWritePayload(input: Partial<FamilyGeofence>) {
  const { radius, radius_meters, ...rest } = input;
  const nextRadius = radius_meters ?? radius;

  return {
    ...rest,
    ...(nextRadius !== undefined ? { radius_meters: nextRadius } : {}),
  };
}

async function requireAuthenticatedUser() {
  const user = await SessionService.getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

async function getPendingInviteForUser(connectionId: string) {
  const user = await requireAuthenticatedUser();
  const normalizedEmail = normalizeEmail(user.email);

  const [byUserId, byEmail] = await Promise.all([
    db
      .from(FAMILY_TABLES.connections)
      .select(CONNECTION_SELECT)
      .eq("id", connectionId)
      .eq("status", FAMILY_CONNECTION_STATUS.PENDING)
      .eq("child_id", user.id)
      .maybeSingle(),
    normalizedEmail
      ? db
          .from(FAMILY_TABLES.connections)
          .select(CONNECTION_SELECT)
          .eq("id", connectionId)
          .eq("status", FAMILY_CONNECTION_STATUS.PENDING)
          .eq("child_email", normalizedEmail)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (byUserId.error) throw byUserId.error;
  if (byEmail.error) throw byEmail.error;

  return {
    invite: (byUserId.data ?? byEmail.data) as FamilyConnection | null,
    user,
  };
}

export class FamilyService {
  static readonly tables = FAMILY_TABLES;

  static async getMyChildren(): Promise<FamilyConnection[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await db
      .from(FAMILY_TABLES.connections)
      .select(CONNECTION_SELECT)
      .eq("parent_id", user.id)
      .eq("status", FAMILY_CONNECTION_STATUS.ACTIVE)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getMyParents(): Promise<FamilyConnection[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await db
      .from(FAMILY_TABLES.connections)
      .select(CONNECTION_SELECT)
      .eq("child_id", user.id)
      .eq("status", FAMILY_CONNECTION_STATUS.ACTIVE)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPendingInvites(): Promise<FamilyConnection[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const normalizedEmail = normalizeEmail(user.email);
    const [byUserId, byEmail] = await Promise.all([
      db
        .from(FAMILY_TABLES.connections)
        .select(CONNECTION_SELECT)
        .eq("child_id", user.id)
        .eq("status", FAMILY_CONNECTION_STATUS.PENDING)
        .order("created_at", { ascending: false }),
      normalizedEmail
        ? db
            .from(FAMILY_TABLES.connections)
            .select(CONNECTION_SELECT)
            .eq("child_email", normalizedEmail)
            .eq("status", FAMILY_CONNECTION_STATUS.PENDING)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (byUserId.error) throw byUserId.error;
    if (byEmail.error) throw byEmail.error;

    const merged = new Map<string, FamilyConnection>();
    for (const invite of [...(byUserId.data || []), ...(byEmail.data || [])]) {
      merged.set(invite.id, invite as FamilyConnection);
    }

    return Array.from(merged.values()).sort((left, right) =>
      right.created_at.localeCompare(left.created_at),
    );
  }

  static async sendFamilyInvite(input: SendFamilyInviteInput): Promise<void> {
    const user = await requireAuthenticatedUser();
    const childEmail = normalizeEmail(input.childEmail);

    if (!childEmail) {
      throw new Error("Email invalido");
    }

    if (normalizeEmail(user.email) === childEmail) {
      throw new Error("Nao e permitido convidar o proprio usuario");
    }

    const { error } = await db.from(FAMILY_TABLES.connections).insert({
      parent_id: user.id,
      child_email: childEmail,
      relationship_type: input.relationshipType,
      status: FAMILY_CONNECTION_STATUS.PENDING,
    });

    if (error) throw error;
  }

  static async acceptFamilyInvite(connectionId: string): Promise<void> {
    const { invite, user } = await getPendingInviteForUser(connectionId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    const { error } = await db
      .from(FAMILY_TABLES.connections)
      .update({
        child_id: user.id,
        child_email: normalizeEmail(user.email),
        status: FAMILY_CONNECTION_STATUS.ACTIVE,
        responded_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) throw error;
  }

  static async rejectFamilyInvite(connectionId: string): Promise<void> {
    const { invite, user } = await getPendingInviteForUser(connectionId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    const { error } = await db
      .from(FAMILY_TABLES.connections)
      .update({
        child_id: user.id,
        child_email: normalizeEmail(user.email),
        status: FAMILY_CONNECTION_STATUS.REJECTED,
        responded_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) throw error;
  }

  static async removeFamilyConnection(connectionId: string): Promise<void> {
    const { error } = await db
      .from(FAMILY_TABLES.connections)
      .delete()
      .eq("id", connectionId);

    if (error) throw error;
  }

  static async getChildrenLocations(): Promise<FamilyLocationData[]> {
    const children = await this.getMyChildren();
    const ids = children
      .map((connection) => connection.child_id)
      .filter((childId): childId is string => Boolean(childId));
    if (!ids.length) return [];

    const { data, error } = await db
      .from(FAMILY_TABLES.locations)
      .select("*")
      .in("user_id", ids)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static subscribeToChildrenLocations(
    callback: (location: FamilyLocationData) => void,
  ) {
    const channel = db
      .channel("children-locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: FAMILY_TABLES.locations },
        (payload: { new: FamilyLocationData }) => callback(payload.new),
      )
      .subscribe();

    return { unsubscribe: () => db.removeChannel(channel) };
  }

  static async getLocationSharingSettings(): Promise<FamilyLocationSharingSettings | null> {
    const user = await SessionService.getCurrentUser();
    if (!user) return null;

    const { data, error } = await db
      .from(FAMILY_TABLES.locationSharingSettings)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateLocationSharingSettings(
    updates: Partial<FamilyLocationSharingSettings>,
  ): Promise<FamilyLocationSharingSettings> {
    const user = await requireAuthenticatedUser();

    const { data, error } = await db
      .from(FAMILY_TABLES.locationSharingSettings)
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateMyLocation(
    location: Omit<FamilyLocationData, "profile_id" | "user_id" | "updated_at">,
  ): Promise<void> {
    const user = await requireAuthenticatedUser();

    const { error } = await db
      .from(FAMILY_TABLES.locations)
      .upsert({ user_id: user.id, ...location }, { onConflict: "user_id" });

    if (error) throw error;
  }

  static async getMyGeofences(): Promise<FamilyGeofence[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await db
      .from(FAMILY_TABLES.geofences)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeGeofence);
  }

  static async createGeofence(
    geofence: Omit<FamilyGeofence, "id" | "profile_id" | "user_id">,
  ): Promise<FamilyGeofence> {
    const user = await requireAuthenticatedUser();

    const { data, error } = await db
      .from(FAMILY_TABLES.geofences)
      .insert({ user_id: user.id, ...mapGeofenceWritePayload(geofence) })
      .select()
      .single();

    if (error) throw error;
    return normalizeGeofence(data);
  }

  static async updateGeofence(
    id: string,
    updates: Partial<FamilyGeofence>,
  ): Promise<void> {
    const { error } = await db
      .from(FAMILY_TABLES.geofences)
      .update(mapGeofenceWritePayload(updates))
      .eq("id", id);

    if (error) throw error;
  }

  static async deleteGeofence(id: string): Promise<void> {
    const { error } = await db.from(FAMILY_TABLES.geofences).delete().eq("id", id);
    if (error) throw error;
  }

  static async getMyAlerts(): Promise<FamilyLocationAlert[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await db
      .from(FAMILY_TABLES.alerts)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static subscribeToAlerts(callback: (alert: FamilyLocationAlert) => void) {
    const channel = db
      .channel("location-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: FAMILY_TABLES.alerts },
        (payload: { new: FamilyLocationAlert }) => callback(payload.new),
      )
      .subscribe();

    return { unsubscribe: () => db.removeChannel(channel) };
  }

  static async markAlertAsRead(alertId: string): Promise<void> {
    const user = await requireAuthenticatedUser();

    const { error } = await db
      .from(FAMILY_TABLES.alerts)
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) throw error;
  }

  static async markAllAlertsAsRead(): Promise<void> {
    const user = await requireAuthenticatedUser();

    const { error } = await db
      .from(FAMILY_TABLES.alerts)
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) throw error;
  }

  static async getCoverageSummaryByUserId(
    userId: string,
    client: any = db,
  ): Promise<FamilyCoverageSummary> {
    const { data, error } = await client
      .from(FAMILY_TABLES.connections)
      .select("id, parent_id, child_id, status, relationship_type")
      .or(`parent_id.eq.${userId},child_id.eq.${userId}`);

    if (error) throw error;

    const rows = (data || []) as FamilyConnection[];
    const activeChildrenCount = rows.filter(
      (row) => row.parent_id === userId && row.status === FAMILY_CONNECTION_STATUS.ACTIVE,
    ).length;
    const activeParentsCount = rows.filter(
      (row) => row.child_id === userId && row.status === FAMILY_CONNECTION_STATUS.ACTIVE,
    ).length;
    const pendingInvitesCount = rows.filter(
      (row) => row.child_id === userId && row.status === FAMILY_CONNECTION_STATUS.PENDING,
    ).length;
    const relationshipTypes = Array.from(
      new Set(
        rows
          .map((row) => row.relationship_type)
          .filter((relationshipType): relationshipType is string => Boolean(relationshipType)),
      ),
    );

    return {
      activeChildrenCount,
      activeParentsCount,
      pendingInvitesCount,
      relationshipTypes,
    };
  }
}

export const familyService = FamilyService;
